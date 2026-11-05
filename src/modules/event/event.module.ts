import { Module } from '@nestjs/common';
import { ApiKeyModule } from '../api-key/api-key.module';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { IngestEventUseCase } from './use-case/ingest-event.use-case';
import { BullModule } from '@nestjs/bullmq';
import { WEBHOOK_DELIVERY_QUEUE } from 'src/infra/queue/queue.constants';

@Module({
  imports: [
    ApiKeyModule,
    BullModule.registerQueue({
      name: WEBHOOK_DELIVERY_QUEUE,
    }),
  ],
  controllers: [EventController],
  providers: [EventService, IngestEventUseCase],
})
export class EventModule {}
