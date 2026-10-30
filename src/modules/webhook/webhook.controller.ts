import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MemberRole } from '../../../generated/prisma/client';
import { JwtAuthGuard } from 'src/general/guards/jwt-auth.guard';
import { RolesGuard } from 'src/general/guards/roles.guard';
import { Roles } from 'src/general/decorators/roles.decorator';
import { CreateWebhookEndpointDto } from './dto/create-webhook-endpoint.dto';
import { WebhookService } from './webhook.service';

@ApiTags('Webhook Endpoints')
@ApiBearerAuth()
@Controller({
  path: 'organizations/:organizationId/projects/:projectId/webhook-endpoints',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post()
  @Roles(MemberRole.OWNER, MemberRole.ADMIN, MemberRole.DEVELOPER)
  @ApiOperation({ summary: 'Create a webhook endpoint' })
  create(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateWebhookEndpointDto,
  ) {
    return this.webhookService.create(organizationId, projectId, dto);
  }

  @Get()
  @Roles(
    MemberRole.OWNER,
    MemberRole.ADMIN,
    MemberRole.DEVELOPER,
    MemberRole.VIEWER,
  )
  @ApiOperation({ summary: 'List webhook endpoints for a project' })
  findAll(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.webhookService.findAll(organizationId, projectId);
  }

  @Delete(':endpointId')
  @Roles(MemberRole.OWNER, MemberRole.ADMIN)
  @ApiOperation({ summary: 'Delete a webhook endpoint' })
  delete(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('endpointId', ParseIntPipe) endpointId: number,
  ) {
    return this.webhookService.delete(organizationId, projectId, endpointId);
  }
}
