import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { MemberRole } from 'generated/prisma/enums';

import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectResponseDto } from './dto/project-response.dto';

import { JwtAuthGuard } from 'src/general/guards/jwt-auth.guard';
import { RolesGuard } from 'src/general/guards/roles.guard';
import { Roles } from 'src/general/decorators/roles.decorator';
import { CurrentUser } from 'src/general/decorators/current-user.decorator';
import type { AuthenticatedRequestUser } from 'src/general/decorators/current-user.decorator';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller({
  path: 'organizations/:organizationId/projects',
  version: '1',
})
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @Roles(MemberRole.OWNER, MemberRole.ADMIN, MemberRole.DEVELOPER)
  @ApiOperation({ summary: 'Create a project' })
  @ApiResponse({ status: 201, type: ProjectResponseDto })
  create(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @CurrentUser() user: AuthenticatedRequestUser,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectService.create(organizationId, user.id, dto);
  }

  @Get()
  @Roles(
    MemberRole.OWNER,
    MemberRole.ADMIN,
    MemberRole.DEVELOPER,
    MemberRole.VIEWER,
  )
  @ApiOperation({ summary: 'List organization projects' })
  @ApiResponse({ status: 200, type: [ProjectResponseDto] })
  findAll(@Param('organizationId', ParseIntPipe) organizationId: number) {
    return this.projectService.findAll(organizationId);
  }

  @Get(':projectId')
  @Roles(
    MemberRole.OWNER,
    MemberRole.ADMIN,
    MemberRole.DEVELOPER,
    MemberRole.VIEWER,
  )
  @ApiOperation({ summary: 'Get a project' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  findOne(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.projectService.findOne(organizationId, projectId);
  }

  @Patch(':projectId')
  @Roles(MemberRole.OWNER, MemberRole.ADMIN, MemberRole.DEVELOPER)
  @ApiOperation({ summary: 'Update a project' })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  update(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectService.update(organizationId, projectId, dto);
  }

  @Delete(':projectId')
  @Roles(MemberRole.OWNER, MemberRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a project' })
  @ApiResponse({ status: 200 })
  remove(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('projectId', ParseIntPipe) projectId: number,
  ) {
    return this.projectService.remove(organizationId, projectId);
  }
}
