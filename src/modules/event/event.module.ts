import { Module } from '@nestjs/common';
import { ApiKeyModule } from '../api-key/api-key.module';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { IngestEventUseCase } from './use-case/ingest-event.use-case';

@Module({
  imports: [ApiKeyModule],
  controllers: [EventController],
  providers: [EventService, IngestEventUseCase],
})
export class EventModule {}
