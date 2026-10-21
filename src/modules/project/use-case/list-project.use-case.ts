import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class ListProjectUseCase {
  constructor(private readonly prisma: PrismaService) {}
  async execute(organizationId: number) {
    return this.prisma.project.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
