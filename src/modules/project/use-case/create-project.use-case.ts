import { Injectable } from '@nestjs/common';
import { CreateProjectDto } from '../dto/create-project.dto';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class CreateProjectUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: number, userId: number, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        organizationId,
        name: dto.name,
        description: dto.description,
        createdById: userId,
      },
    });
  }
}
