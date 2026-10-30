import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class DeleteWebhookEndpointUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(organizationId: number, projectId: number, endpointId: number) {
    const endpoint = await this.prisma.webhookEndpoint.findFirst({
      where: {
        id: endpointId,
        projectId,
        project: { is: { organizationId } },
      },
      select: { id: true },
    });

    if (!endpoint) {
      throw new NotFoundException('Webhook endpoint not found.');
    }

    await this.prisma.webhookEndpoint.delete({
      where: { id: endpoint.id },
    });

    return { message: 'Webhook endpoint deleted successfully.' };
  }
}
