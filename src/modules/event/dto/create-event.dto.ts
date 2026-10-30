import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventDto {
  @ApiProperty({
    example: 'order.created',
    description: 'Name identifying the event.',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: {
      orderId: 'order_123',
      amount: 49.99,
      currency: 'EUR',
    },
    description: 'JSON object containing the event data.',
    type: Object,
  })
  @IsObject()
  payload!: Record<string, unknown>;

  @ApiPropertyOptional({
    example: 'order-created-order_123',
    description:
      'Optional key used to prevent duplicate event ingestion when retrying a request.',
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  @IsNotEmpty()
  idempotencyKey?: string;
}
