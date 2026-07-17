import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { LivenessResponseDto } from './dto/liveness-response.dto';
import { ReadinessResponseDto } from './dto/readiness-response.dto';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}
  async getReadiness(): Promise<ReadinessResponseDto> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        checks: {
          database: 'up',
        },
      };
    } catch {
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
