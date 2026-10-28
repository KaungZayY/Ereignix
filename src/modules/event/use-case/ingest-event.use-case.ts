import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { ApiKeyContext } from 'src/general/guards/api-key-auth.guard';
import { CreateEventDto } from '../dto/create-event.dto';
import { EventResponseDto } from '../dto/event-response.dto';

@Injectable()
export class IngestEventUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    apiKey: ApiKeyContext,
    dto: CreateEventDto,
  ): Promise<EventResponseDto> {
    if (dto.idempotencyKey) {
      const existing = await this.prisma.event.findUnique({
        where: {
          projectId_idempotencyKey: {
            projectId: apiKey.projectId,
            idempotencyKey: dto.idempotencyKey,
          },
        },
      });

      if (existing) {
        return existing as EventResponseDto;
      }
    }

    try {
      return (await this.prisma.event.create({
        data: {
          projectId: apiKey.projectId,
          name: dto.name,
          payload: dto.payload as Prisma.InputJsonValue,
          idempotencyKey: dto.idempotencyKey ?? null,
        },
      })) as EventResponseDto;
    } catch (error) {
      // Handle two identical requests arriving at the same time.
      if (
        dto.idempotencyKey &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.prisma.event.findUnique({
          where: {
            projectId_idempotencyKey: {
              projectId: apiKey.projectId,
              idempotencyKey: dto.idempotencyKey,
            },
          },
        });

        if (existing) {
          return existing as EventResponseDto;
        }
      }

      throw error;
    }
  }
}
