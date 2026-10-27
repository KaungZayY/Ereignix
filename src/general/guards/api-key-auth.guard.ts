import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { ApiKeyCryptoService } from 'src/modules/api-key/services/api-key-crypto.service';
export interface ApiKeyContext {
  id: number;
  projectId: number;
  organizationId: number;
}

export type ApiKeyRequest = Request & {
  apiKey?: ApiKeyContext;
};

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cryptoService: ApiKeyCryptoService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ApiKeyRequest>();
    const header = request.headers['x-api-key'];

    if (typeof header !== 'string' || !header) {
      throw new UnauthorizedException('Invalid API key.');
    }

    const parsedKey = this.cryptoService.parse(header);

    if (!parsedKey) {
      throw new UnauthorizedException('Invalid API key.');
    }

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { keyId: parsedKey.keyId },
      select: {
        id: true,
        projectId: true,
        keyHash: true,
        revokedAt: true,
        project: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (
      !apiKey ||
      apiKey.revokedAt !== null ||
      !this.cryptoService.verify(parsedKey.secret, apiKey.keyHash)
    ) {
      throw new UnauthorizedException('Invalid API key.');
    }

    await this.prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
      select: { id: true },
    });

    request.apiKey = {
      id: apiKey.id,
      projectId: apiKey.projectId,
      organizationId: apiKey.project.organizationId,
    };

    return true;
  }
}
