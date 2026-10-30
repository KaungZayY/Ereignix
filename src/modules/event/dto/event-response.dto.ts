import { ApiProperty } from '@nestjs/swagger';

export class EventResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  projectId!: number;

  @ApiProperty({ example: 'order.created' })
  name!: string;

  @ApiProperty({
    example: {
      orderId: 'order_123',
      amount: 49.99,
      currency: 'EUR',
    },
    type: Object,
  })
  payload!: Record<string, unknown>;

  @ApiProperty({
    example: 'order-created-order_123',
    nullable: true,
  })
  idempotencyKey!: string | null;

  @ApiProperty({ example: '2026-10-30T08:00:00.000Z' })
  createdAt!: Date;
}
