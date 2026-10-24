import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
import { CreatedApiKeyResponseDto } from '../dto/created-api-key-response.dto';
import { ApiKeyCryptoService } from '../services/api-key-crypto.service';

@Injectable()
export class CreateApiKeyUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: ApiKeyCryptoService,
  ) {}

  async execute(
    organizationId: number,
    projectId: number,
    dto: CreateApiKeyDto,
  ): Promise<CreatedApiKeyResponseDto> {
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

    const generated = this.cryptoService.generate();

    const apiKey = await this.prisma.apiKey.create({
      data: {
        keyId: generated.keyId,
        projectId: project.id,
        name: dto.name,
        keyHash: generated.keyHash,
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
    });

    return {
      apiKey,
      secret: generated.rawKey,
    };
  }
}
