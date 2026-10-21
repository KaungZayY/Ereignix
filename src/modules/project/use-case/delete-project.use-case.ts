import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class DeleteProjectUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: number, projectId: number) {
    const project = await this.prisma.project.findFirst({
      where: {
        id: projectId,
        organizationId,
      },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    await this.prisma.project.delete({
      where: { id: project.id },
    });

    return { message: 'Project deleted successfully.' };
  }
}
