
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  WEBHOOK_DELIVERY_JOB,
  WEBHOOK_DELIVERY_QUEUE,
} from 'src/infra/queue/queue.constants';

@Injectable()
export class WebhookDeliveryDispatcherService {
  private readonly logger = new Logger(
    WebhookDeliveryDispatcherService.name,
  );

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(WEBHOOK_DELIVERY_QUEUE)
    private readonly deliveryQueue: Queue,
  ) {}

  @Cron('*/10 * * * * *')
  async dispatchPendingDeliveries(): Promise<void> {
    const staleBefore = new Date(Date.now() - 2 * 60 * 1000);

    // Recover deliveries left PROCESSING by a crashed worker.
    await this.prisma.webhookDelivery.updateMany({
      where: {
        status: 'PROCESSING',
        updatedAt: { lt: staleBefore },
      },
      data: {
        status: 'PENDING',
        lastError: 'Recovered after a stale processing attempt.',
      },
    });

    const deliveries = await this.prisma.webhookDelivery.findMany({
      where: {
        status: 'PENDING',
        OR: [
          { nextAttemptAt: null },
          { nextAttemptAt: { lte: new Date() } },
        ],
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: 100,
    });

    for (const delivery of deliveries) {
      try {
        await this.deliveryQueue.add(
          WEBHOOK_DELIVERY_JOB,
          { deliveryId: delivery.id },
          {
            jobId: `delivery-${delivery.id}`,
            attempts: 5,
            backoff: {
              type: 'exponential',
              delay: 1000,
            },
            removeOnComplete: 1000,
            removeOnFail: false,
          },
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown queue error';

        this.logger.error(
          `Could not enqueue delivery ${delivery.id}: ${message}`,
        );
      }
    }
  }
}
