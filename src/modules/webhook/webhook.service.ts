import { Injectable } from '@nestjs/common';
import { CreateWebhookEndpointDto } from './dto/create-webhook-endpoint.dto';
import { CreateWebhookEndpointUseCase } from './use-case/create-webhook-endpoint.use-case';
import { ListWebhookEndpointsUseCase } from './use-case/list-webhook-endpoints.use-case';
import { DeleteWebhookEndpointUseCase } from './use-case/delete-webhook-endpoint.use-case';

@Injectable()
export class WebhookService {
  constructor(
    private readonly createUseCase: CreateWebhookEndpointUseCase,
    private readonly listUseCase: ListWebhookEndpointsUseCase,
    private readonly deleteUseCase: DeleteWebhookEndpointUseCase,
  ) {}

  create(
    organizationId: number,
    projectId: number,
    dto: CreateWebhookEndpointDto,
  ) {
    return this.createUseCase.execute(organizationId, projectId, dto);
  }

  findAll(organizationId: number, projectId: number) {
    return this.listUseCase.execute(organizationId, projectId);
  }

  delete(organizationId: number, projectId: number, endpointId: number) {
    return this.deleteUseCase.execute(organizationId, projectId, endpointId);
  }
}
