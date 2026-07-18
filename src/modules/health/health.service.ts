import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { LivenessResponseDto } from './dto/liveness-response.dto';
import { ReadinessResponseDto } from './dto/readiness-response.dto';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService, 
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(HealthService.name);
  }
  async getReadiness(): Promise<ReadinessResponseDto> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        checks: {
          database: 'up',
        },
      };
    } catch (error:unknown) {
      this.logger.error(error)
      return {
        status: 'error',
        checks: {
          database: 'down',
        },
      };
    }
  }

  getLiveness(): LivenessResponseDto {
    return {
      status: 'ok',
    };
  }
}
