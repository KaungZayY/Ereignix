import { Injectable } from '@nestjs/common';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';
import { CreateApiKeyUseCase } from '../use-cases/create-api-key.use-case';
import { ListApiKeysUseCase } from '../use-cases/list-api-key.use-case';
import { RevokeApiKeyUseCase } from '../use-cases/revoke-api-key.use-case';

@Injectable()
export class ApiKeyService {
  constructor(
    private readonly createApiKeyUseCase: CreateApiKeyUseCase,
    private readonly listApiKeysUseCase: ListApiKeysUseCase,
    private readonly revokeApiKeyUseCase: RevokeApiKeyUseCase,
  ) {}

  create(organizationId: number, projectId: number, dto: CreateApiKeyDto) {
    return this.createApiKeyUseCase.execute(organizationId, projectId, dto);
  }

  findAll(organizationId: number, projectId: number) {
    return this.listApiKeysUseCase.execute(organizationId, projectId);
  }

  revoke(organizationId: number, projectId: number, apiKeyId: number) {
    return this.revokeApiKeyUseCase.execute(
      organizationId,
      projectId,
      apiKeyId,
    );
  }
}
