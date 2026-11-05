import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { createHmac } from 'crypto';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  WEBHOOK_DELIVERY_JOB,
  WEBHOOK_DELIVERY_QUEUE,
} from 'src/infra/queue/queue.constants';

interface WebhookDeliveryJob {
  deliveryId: number;
}

@Processor(WEBHOOK_DELIVERY_QUEUE, {
  concurrency: 10,
})
@Injectable()
@Processor(WEBHOOK_DELIVERY_QUEUE, {
  concurrency: 10,
})
export class WebhookDeliveryProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<WebhookDeliveryJob>): Promise<void> {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: {
        id: job.data.deliveryId,
      },
      include: {
        event: true,
        endpoint: true,
      },
    });

    if (!delivery) {
      return;
    }

    // Do not process deliveries that are already terminal.
    if (delivery.status === 'SUCCEEDED' || delivery.status === 'FAILED') {
      return;
    }

    if (!delivery.endpoint.enabled) {
      await this.prisma.webhookDelivery.update({
        where: {
          id: delivery.id,
        },
        data: {
          status: 'FAILED',
          nextAttemptAt: null,
          lastError: 'Webhook endpoint is disabled.',
        },
      });

      return;
    }

    // Record the attempt before making the HTTP request.
    await this.prisma.webhookDelivery.update({
      where: {
        id: delivery.id,
      },
      data: {
        status: 'PROCESSING',
        attemptCount: {
          increment: 1,
        },
      },
    });

    let responseStatusCode: number | null = null;

    try {
      const payload = JSON.stringify({
        id: delivery.event.id,
        name: delivery.event.name,
        payload: delivery.event.payload,
        createdAt: delivery.event.createdAt.toISOString(),
      });

      const timestamp = Math.floor(Date.now() / 1000).toString();

      const signature = createHmac('sha256', delivery.endpoint.secret)
        .update(`${timestamp}.${payload}`)
        .digest('hex');

      const response = await fetch(delivery.endpoint.url, {
        method: 'POST',
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000),
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Ereignix-Webhook/1.0',
          'X-Ereignix-Event': delivery.event.name,
          'X-Ereignix-Delivery': delivery.id.toString(),
          'X-Ereignix-Timestamp': timestamp,
          'X-Ereignix-Signature': `sha256=${signature}`,
        },
        body: payload,
      });

      responseStatusCode = response.status;

      if (!response.ok) {
        throw new Error(
          `Webhook request failed with status ${response.status}.`,
        );
      }

      await this.prisma.webhookDelivery.update({
        where: {
          id: delivery.id,
        },
        data: {
          status: 'SUCCEEDED',
          responseStatusCode,
          deliveredAt: new Date(),
          nextAttemptAt: null,
          lastError: null,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown webhook delivery error';

      const maxAttempts = job.opts.attempts ?? 1;
      const isFinalAttempt = job.attemptsMade + 1 >= maxAttempts;

      // Match the delay configured in the BullMQ exponential backoff.
      const retryDelay = 1000 * 2 ** job.attemptsMade;

      await this.prisma.webhookDelivery.update({
        where: {
          id: delivery.id,
        },
        data: {
          status: isFinalAttempt ? 'FAILED' : 'PENDING',
          responseStatusCode,
          lastError: message.slice(0, 1000),
          nextAttemptAt: isFinalAttempt
            ? null
            : new Date(Date.now() + retryDelay),
        },
      });

      // BullMQ must receive the error to trigger its retry mechanism.
      throw error;
    }
  }
}
