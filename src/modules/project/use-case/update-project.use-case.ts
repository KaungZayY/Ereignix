import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { UpdateProjectDto } from '../dto/update-project.dto';

@Injectable()
export class UpdateProjectUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    organizationId: number,
    projectId: number,
    dto: UpdateProjectDto,
  ) {
    if (dto.name === undefined && dto.description === undefined) {
      throw new BadRequestException('At least one field must be provided.');
    }

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
    return this.prisma.project.update({
      where: { id: project.id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && {
          description: dto.description,
        }),
      },
    });
  }
}
