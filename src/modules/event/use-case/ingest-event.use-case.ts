import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { ApiKeyContext } from 'src/general/guards/api-key-auth.guard';
import { CreateEventDto } from '../dto/create-event.dto';
import { EventResponseDto } from '../dto/event-response.dto';
import {
  WEBHOOK_DELIVERY_JOB,
  WEBHOOK_DELIVERY_QUEUE,
} from 'src/infra/queue/queue.constants';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class IngestEventUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(WEBHOOK_DELIVERY_QUEUE)
    private readonly deliveryQueue: Queue,
  ) {}

  async execute(apiKey: ApiKeyContext, dto: CreateEventDto) {
    console.log('start')
    if (dto.idempotencyKey) {
      const existing = await this.prisma.event.findUnique({
        where: {
          projectId_idempotencyKey: {
            projectId: apiKey.projectId,
            idempotencyKey: dto.idempotencyKey,
          },
        },
      });

      if (existing) return existing;
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: {
          projectId: apiKey.projectId,
          name: dto.name,
          payload: dto.payload as Prisma.InputJsonValue,
          idempotencyKey: dto.idempotencyKey ?? null,
        },
      });

      const endpoints = await tx.webhookEndpoint.findMany({
        where: {
          projectId: apiKey.projectId,
          enabled: true,
          subscriptions: {
            some: { eventName: dto.name },
          },
        },
        select: { id: true },
      });
      // console.log('API KEY PROJECT ID:', apiKey.projectId);
      // console.log('EVENT NAME:', dto.name);
      // console.log('MATCHING ENDPOINTS:', endpoints);

      const deliveries: { id: number }[] = [];

      for (const endpoint of endpoints) {
        deliveries.push(
          await tx.webhookDelivery.create({
            data: {
              eventId: event.id,
              endpointId: endpoint.id,
            },
            select: { id: true },
          }),
        );
      }
      // console.log('CREATED DELIVERIES:', deliveries);

      return { event, deliveries };
    });

    for (const delivery of result.deliveries) {
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
    }
    return result.event;
  }
}
