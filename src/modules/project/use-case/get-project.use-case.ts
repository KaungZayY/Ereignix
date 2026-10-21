import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class GetProjectUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: number, projectId: number) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId: organizationId,
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found.');
    }
    return project;
  }
}
