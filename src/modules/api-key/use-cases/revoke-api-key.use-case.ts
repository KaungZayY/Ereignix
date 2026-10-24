import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class RevokeApiKeyUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: number, projectId: number, apiKeyId: number) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        projectId,
        project: {
          organizationId,
        },
        revokedAt: null,
      },
      select: { id: true },
    });

    if (!apiKey) {
      throw new NotFoundException('Active API key not found.');
    }

    await this.prisma.apiKey.updateMany({
      where: {
        id: apiKey.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      message: 'API key revoked successfully.',
    };
  }
}
