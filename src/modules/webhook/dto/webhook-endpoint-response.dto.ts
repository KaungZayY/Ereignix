import { ApiProperty } from '@nestjs/swagger';

export class WebhookEndpointResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  projectId!: number;

  @ApiProperty({ example: 'Order notifications' })
  name!: string;

  @ApiProperty({ example: 'https://example.com/webhooks/orders' })
  url!: string;

  @ApiProperty({ example: true })
  enabled!: boolean;

  @ApiProperty({
    example: ['order.created', 'order.cancelled'],
    type: [String],
  })
  eventNames!: string[];

  @ApiProperty({ example: '2026-10-30T08:00:00.000Z' })
  createdAt!: Date;
}
