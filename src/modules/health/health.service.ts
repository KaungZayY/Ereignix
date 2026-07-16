import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}
  async getReadiness() {
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

  getLiveness() {
    return {
      status: 'ok',
    };
  }
}
