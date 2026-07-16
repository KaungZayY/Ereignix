import { Controller, Get } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly logger: PinoLogger,
    private readonly healthService: HealthService
  ) {
    this.logger.setContext(HealthController.name);
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe' })
  getLiveness() {
    return this.healthService.getLiveness();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe' })
  getReadiness() {
    return this.healthService.getReadiness();
  }
}
