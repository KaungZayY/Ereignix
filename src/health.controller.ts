import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './infra/prisma/prisma.service';
import { PinoLogger } from 'nestjs-pino';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller({path: 'health', version: '1'})
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(HealthController.name);
  }

  @Get()
  @ApiOperation({
    summary: 'Check application health',
  })
  @ApiResponse({
    status: 200,
    description: 'Application is running correctly.',
  })
  async health() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
      };
    } catch (error: any) {
      this.logger.error(error.message, error.stack);
      return {
        status: 'error',
        database: 'disconnected',
        message: error.message,
      };
    }
  }
}
