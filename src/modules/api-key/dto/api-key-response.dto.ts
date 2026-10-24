import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  keyId: string;

  @ApiProperty()
  projectId: number;

  @ApiProperty({ nullable: true })
  lastUsedAt: Date | null;

  @ApiProperty({ nullable: true })
  revokedAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}
