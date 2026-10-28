import { Injectable } from '@nestjs/common';
import { ApiKeyContext } from 'src/general/guards/api-key-auth.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { EventResponseDto } from './dto/event-response.dto';
import { IngestEventUseCase } from './use-case/ingest-event.use-case';

@Injectable()
export class EventService {
  constructor(private readonly ingestEventUseCase: IngestEventUseCase) {}

  ingest(
    apiKey: ApiKeyContext,
    dto: CreateEventDto,
  ): Promise<EventResponseDto> {
    return this.ingestEventUseCase.execute(apiKey, dto);
  }
}
