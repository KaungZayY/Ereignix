import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { createHmac } from 'crypto';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  WEBHOOK_DELIVERY_JOB,
  WEBHOOK_DELIVERY_QUEUE,
} from 'src/infra/queue/queue.constants';

interface DeliveryJob {
  deliveryId: number;
}

@Processor(WEBHOOK_DELIVERY_QUEUE, {
  concurrency: 10,
})
@Injectable()
export class WebhookDeliveryProcessor extends WorkerHost {
  private readonly logger = new Logger(WebhookDeliveryProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<DeliveryJob>): Promise<void> {
    if (job.name !== WEBHOOK_DELIVERY_JOB) return;

    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: { id: job.data.deliveryId },
      include: {
        event: true,
        endpoint: true,
      },
    });

    if (!delivery || delivery.status === 'SUCCEEDED') return;

    if (!delivery.endpoint.enabled) {
      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'FAILED',
          lastError: 'Webhook endpoint is disabled.',
          nextAttemptAt: null,
        },
      });
      return;
    }

    const attemptCount = delivery.attemptCount + 1;

    await this.prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'PROCESSING',
        attemptCount,
        lastError: null,
        nextAttemptAt: null,
      },
    });

    const timestamp = Math.floor(Date.now() / 1000).toString();

    const payload = JSON.stringify({
      id: delivery.event.id,
      name: delivery.event.name,
      payload: delivery.event.payload,
      createdAt: delivery.event.createdAt.toISOString(),
    });

    const signature = createHmac('sha256', delivery.endpoint.secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    try {
      const response = await fetch(delivery.endpoint.url, {
        method: 'POST',
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000),
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Ereignix-Webhook/1.0',
          'X-Ereignix-Event': delivery.event.name,
          'X-Ereignix-Delivery': String(delivery.id),
          'X-Ereignix-Timestamp': timestamp,
          'X-Ereignix-Signature': `sha256=${signature}`,
        },
        body: payload,
      });

      if (!response.ok) {
        const error = `Webhook returned HTTP ${response.status}`;

        await this.recordFailure(delivery.id, error, response.status, job);

        throw new Error(error);
      }

      await this.prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'SUCCEEDED',
          responseStatusCode: response.status,
          deliveredAt: new Date(),
          lastError: null,
          nextAttemptAt: null,
        },
      });

      this.logger.log(`Delivery ${delivery.id} succeeded.`);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.startsWith('Webhook returned HTTP ')
      ) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : 'Unknown delivery error';

      await this.recordFailure(delivery.id, message, null, job);

      throw error;
    }
  }

  private async recordFailure(
    deliveryId: number,
    message: string,
    responseStatusCode: number | null,
    job: Job<DeliveryJob>,
  ) {
    const maxAttempts = Number(job.opts.attempts ?? 1);
    const finalAttempt = job.attemptsMade + 1 >= maxAttempts;

    const backoff = job.opts.backoff;
    const baseDelay =
      typeof backoff === 'number' ? backoff : (backoff?.delay ?? 1000);

    await this.prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: finalAttempt ? 'FAILED' : 'PENDING',
        responseStatusCode,
        lastError: message.slice(0, 2000),
        nextAttemptAt: finalAttempt
          ? null
          : new Date(Date.now() + baseDelay * 2 ** job.attemptsMade),
      },
    });

    this.logger.warn(`Delivery ${deliveryId} failed: ${message}`);
  }
}
