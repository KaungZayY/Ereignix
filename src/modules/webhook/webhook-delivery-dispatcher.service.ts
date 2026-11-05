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
  private readonly logger = new Logger(WebhookDeliveryDispatcherService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(WEBHOOK_DELIVERY_QUEUE)
    private readonly deliveryQueue: Queue,
  ) {}

  @Cron('*/10 * * * * *')
  async dispatchPendingDeliveries(): Promise<void> {
    await this.recoverStaleDeliveries();
    await this.enqueuePendingDeliveries();
  }

  private async recoverStaleDeliveries(): Promise<void> {
    // The worker's HTTP request timeout is 10 seconds.
    // Five minutes gives normal processing plenty of time to finish.
    const staleBefore = new Date(Date.now() - 5 * 60 * 1000);

    const result = await this.prisma.webhookDelivery.updateMany({
      where: {
        status: 'PROCESSING',
        updatedAt: {
          lt: staleBefore,
        },
      },
      data: {
        status: 'PENDING',
        nextAttemptAt: null,
        lastError: 'Recovered after a stale processing attempt.',
      },
    });

    if (result.count > 0) {
      this.logger.warn(`Recovered ${result.count} stale webhook deliveries.`);
    }
  }

  private async enqueuePendingDeliveries(): Promise<void> {
    const deliveries = await this.prisma.webhookDelivery.findMany({
      where: {
        status: 'PENDING',
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
      },
      select: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 100,
    });

    for (const delivery of deliveries) {
      await this.enqueueDelivery(delivery.id);
    }
  }

  private async enqueueDelivery(deliveryId: number): Promise<void> {
    const jobId = `delivery-${deliveryId}`;

    try {
      const existingJob = await this.deliveryQueue.getJob(jobId);

      if (existingJob) {
        const state = await existingJob.getState();

        // These jobs are already queued or being processed.
        if (
          state === 'waiting' ||
          state === 'active' ||
          state === 'delayed' ||
          state === 'waiting-children' ||
          state === 'prioritized'
        ) {
          return;
        }

        // A completed or terminally failed job must not block
        // a delivery that is still PENDING in the database.
        if (state === 'completed' || state === 'failed') {
          await existingJob.remove();
        }
      }

      await this.deliveryQueue.add(
        WEBHOOK_DELIVERY_JOB,
        { deliveryId },
        {
          jobId,
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

      this.logger.error(`Could not enqueue delivery ${deliveryId}: ${message}`);
    }
  }
}
