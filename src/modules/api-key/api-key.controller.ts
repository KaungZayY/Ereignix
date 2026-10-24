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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MemberRole } from '../../../generated/prisma/client';

import { ApiKeyService } from './services/api-key.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKeyResponseDto } from './dto/api-key-response.dto';
import { CreatedApiKeyResponseDto } from './dto/created-api-key-response.dto';

import { JwtAuthGuard } from 'src/general/guards/jwt-auth.guard';
import { RolesGuard } from 'src/general/guards/roles.guard';
import { Roles } from 'src/general/decorators/roles.decorator';

@ApiTags('API Keys')
@ApiBearerAuth()
@Controller({
  path: 'organizations/:organizationId/projects/:projectId/api-keys',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @Roles(MemberRole.OWNER, MemberRole.ADMIN)
  @ApiOperation({ summary: 'Create an API key' })
  @ApiResponse({
    status: 201,
    type: CreatedApiKeyResponseDto,
  })
  create(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateApiKeyDto,
  ) {
    return this.apiKeyService.create(organizationId, projectId, dto);
  }

  @Get()
  @Roles(
    MemberRole.OWNER,
    MemberRole.ADMIN,
    MemberRole.DEVELOPER,
    MemberRole.VIEWER,
  )
  @ApiOperation({ summary: 'List project API keys' })
  @ApiResponse({
    status: 200,
    type: [ApiKeyResponseDto],
  })
  findAll(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.apiKeyService.findAll(organizationId, projectId);
  }

  @Delete(':apiKeyId')
  @Roles(MemberRole.OWNER, MemberRole.ADMIN)
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiResponse({ status: 200 })
  revoke(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('apiKeyId', ParseIntPipe) apiKeyId: number,
  ) {
    return this.apiKeyService.revoke(organizationId, projectId, apiKeyId);
  }
}
