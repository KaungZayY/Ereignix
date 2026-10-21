import { Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CreateProjectUseCase } from './use-case/create-project.use-case';
import { ListProjectUseCase } from './use-case/list-project.use-case';
import { GetProjectUseCase } from './use-case/get-project.use-case';
import { UpdateProjectUseCase } from './use-case/update-project.use-case';
import { DeleteProjectUseCase } from './use-case/delete-project.use-case';

@Injectable()
export class ProjectService {
  constructor(
    private readonly createProjectUseCase: CreateProjectUseCase,
    private readonly listProjectsUseCase: ListProjectUseCase,
    private readonly getProjectUseCase: GetProjectUseCase,
    private readonly updateProjectUseCase: UpdateProjectUseCase,
    private readonly deleteProjectUseCase: DeleteProjectUseCase,
  ) {}

  create(organizationId: number, userId: number, dto: CreateProjectDto) {
    return this.createProjectUseCase.execute(organizationId, userId, dto);
  }

  findAll(organizationId: number) {
    return this.listProjectsUseCase.execute(organizationId);
  }

  findOne(organizationId: number, projectId: number) {
    return this.getProjectUseCase.execute(organizationId, projectId);
  }

  update(organizationId: number, projectId: number, dto: UpdateProjectDto) {
    return this.updateProjectUseCase.execute(organizationId, projectId, dto);
  }

  remove(organizationId: number, projectId: number) {
    return this.deleteProjectUseCase.execute(organizationId, projectId);
  }
}
