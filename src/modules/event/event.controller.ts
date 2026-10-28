import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ApiKeyAuthGuard,
  type ApiKeyContext,
} from 'src/general/guards/api-key-auth.guard';
import { CurrentApiKey } from 'src/general/decorators/current-api-key.decorator';
import { CreateEventDto } from './dto/create-event.dto';
import { EventResponseDto } from './dto/event-response.dto';
import { EventService } from './event.service';

@ApiTags('Events')
@Controller({ path: 'events', version: '1' })
@UseGuards(ApiKeyAuthGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiHeader({
    name: 'x-api-key',
    required: true,
    description: 'Project API key',
  })
  @ApiOperation({ summary: 'Ingest an event into a project' })
  @ApiResponse({ status: 201, type: EventResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid or revoked API key' })
  ingest(
    @CurrentApiKey() apiKey: ApiKeyContext,
    @Body() dto: CreateEventDto,
  ): Promise<EventResponseDto> {
    return this.eventService.ingest(apiKey, dto);
  }
}
