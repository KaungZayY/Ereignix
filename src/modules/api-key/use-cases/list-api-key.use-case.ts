import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class ListApiKeysUseCase {
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

    return this.prisma.apiKey.findMany({
      where: {
        projectId: project.id,
      },
      select: {
        id: true,
        name: true,
        keyId: true,
        projectId: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
