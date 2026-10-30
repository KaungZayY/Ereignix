import {
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUrl,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWebhookEndpointDto {
  @ApiProperty({
    example: 'Order notifications',
    description: 'A descriptive name for the webhook endpoint.',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 'https://example.com/webhooks/orders',
    description: 'HTTPS URL that will receive webhook deliveries.',
  })
  @IsUrl({
    require_protocol: true,
    protocols: ['https'],
    require_tld: true,
  })
  url!: string;

  @ApiProperty({
    example: ['order.created', 'order.cancelled'],
    description: 'Event names this endpoint subscribes to.',
    type: [String],
    minItems: 1,
    maxItems: 50,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(100, { each: true })
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/, { each: true })
  eventNames!: string[];
}
