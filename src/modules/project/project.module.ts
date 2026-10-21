import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectController } from './project.controller';
import { ProjectService } from './project.service';

import { CreateProjectUseCase } from './use-case/create-project.use-case';
import { ListProjectUseCase } from './use-case/list-project.use-case';
import { GetProjectUseCase } from './use-case/get-project.use-case';
import { UpdateProjectUseCase } from './use-case/update-project.use-case';
import { DeleteProjectUseCase } from './use-case/delete-project.use-case';
import { UserModule } from '../user/user.module';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [ProjectController],
  providers: [
    ProjectService,
    CreateProjectUseCase,
    ListProjectUseCase,
    GetProjectUseCase,
    UpdateProjectUseCase,
    DeleteProjectUseCase,
  ],
})
export class ProjectModule {}