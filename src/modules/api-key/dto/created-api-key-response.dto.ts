import { ApiProperty } from '@nestjs/swagger';
import { ApiKeyResponseDto } from './api-key-response.dto';

export class CreatedApiKeyResponseDto {
  @ApiProperty({ type: ApiKeyResponseDto })
  apiKey: ApiKeyResponseDto;

  @ApiProperty({
    description:
      'The raw API key. Store it securely; it cannot be retrieved again.',
    example: 'evg_live_<key-id>_<secret>',
  })
  secret: string;
}
