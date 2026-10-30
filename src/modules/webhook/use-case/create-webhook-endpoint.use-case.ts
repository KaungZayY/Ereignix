import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateWebhookEndpointDto } from '../dto/create-webhook-endpoint.dto';

@Injectable()
export class CreateWebhookEndpointUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(
    organizationId: number,
    projectId: number,
    dto: CreateWebhookEndpointDto,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const secret = randomBytes(32).toString('base64url');

    const endpoint = await this.prisma.webhookEndpoint.create({
      data: {
        projectId,
        name: dto.name,
        url: dto.url,
        secret,
        subscriptions: {
          create: dto.eventNames.map((eventName) => ({ eventName })),
        },
      },
      include: {
        subscriptions: { select: { eventName: true } },
      },
    });

    return {
      endpoint: {
        id: endpoint.id,
        projectId: endpoint.projectId,
        name: endpoint.name,
        url: endpoint.url,
        enabled: endpoint.enabled,
        eventNames: endpoint.subscriptions.map((item) => item.eventName),
        createdAt: endpoint.createdAt,
      },
      secret,
    };
  }
}
