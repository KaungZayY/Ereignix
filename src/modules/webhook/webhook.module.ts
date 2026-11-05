import { Module } from '@nestjs/common';
import { AuthModule } from 'src/modules/auth/auth.module';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { CreateWebhookEndpointUseCase } from './use-case/create-webhook-endpoint.use-case';
import { ListWebhookEndpointsUseCase } from './use-case/list-webhook-endpoints.use-case';
import { DeleteWebhookEndpointUseCase } from './use-case/delete-webhook-endpoint.use-case';
import { UserModule } from '../user/user.module';
import { BullModule } from '@nestjs/bullmq';
import { WEBHOOK_DELIVERY_QUEUE } from 'src/infra/queue/queue.constants';
import { WebhookDeliveryProcessor } from './webhook-delivery.processor';
import { WebhookDeliveryDispatcherService } from './webhook-delivery-dispatcher.service';
import { WebhookSecretService } from './webhook-secret.service';

@Module({
  imports: [
    AuthModule,
    UserModule,
    BullModule.registerQueue({
      name: WEBHOOK_DELIVERY_QUEUE,
    }),
  ],
  controllers: [WebhookController],
  providers: [
    WebhookService,
    CreateWebhookEndpointUseCase,
    ListWebhookEndpointsUseCase,
    DeleteWebhookEndpointUseCase,
    WebhookDeliveryProcessor,
    WebhookDeliveryDispatcherService,
    WebhookSecretService,
  ],
})
export class WebhookModule {}
