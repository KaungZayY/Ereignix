import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class ListWebhookEndpointsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: number, projectId: number) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('Project not found.');
    }

    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      include: {
        subscriptions: { select: { eventName: true } },
      },
    });

    return endpoints.map((endpoint) => ({
      id: endpoint.id,
      projectId: endpoint.projectId,
      name: endpoint.name,
      url: endpoint.url,
      enabled: endpoint.enabled,
      eventNames: endpoint.subscriptions.map((item) => item.eventName),
      createdAt: endpoint.createdAt,
    }));
  }
}
