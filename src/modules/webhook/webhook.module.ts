import { Module } from '@nestjs/common';
import { AuthModule } from 'src/modules/auth/auth.module';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { CreateWebhookEndpointUseCase } from './use-case/create-webhook-endpoint.use-case';
import { ListWebhookEndpointsUseCase } from './use-case/list-webhook-endpoints.use-case';
import { DeleteWebhookEndpointUseCase } from './use-case/delete-webhook-endpoint.use-case';
import { UserModule } from '../user/user.module';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [WebhookController],
  providers: [
    WebhookService,
    CreateWebhookEndpointUseCase,
    ListWebhookEndpointsUseCase,
    DeleteWebhookEndpointUseCase,
  ],
})
export class WebhookModule {}
