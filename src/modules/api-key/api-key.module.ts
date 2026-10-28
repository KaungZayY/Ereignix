import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';

import { ApiKeyController } from './api-key.controller';
import { ApiKeyService } from './services/api-key.service';
import { ApiKeyCryptoService } from './services/api-key-crypto.service';

import { CreateApiKeyUseCase } from './use-cases/create-api-key.use-case';
import { ListApiKeysUseCase } from './use-cases/list-api-key.use-case';
import { RevokeApiKeyUseCase } from './use-cases/revoke-api-key.use-case';
import { UserModule } from '../user/user.module';
import { ApiKeyAuthGuard } from 'src/general/guards/api-key-auth.guard';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [ApiKeyController],
  providers: [
    ApiKeyService,
    ApiKeyCryptoService,
    CreateApiKeyUseCase,
    ListApiKeysUseCase,
    RevokeApiKeyUseCase,
    ApiKeyAuthGuard,
  ],
  exports: [ApiKeyCryptoService],
})
export class ApiKeyModule {}
