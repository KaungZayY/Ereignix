import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class AuthenticatedOrganizationDto {
  @Expose()
  @ApiProperty()
  id: number;

  @Expose()
  @ApiProperty()
  name: string;

  @Expose()
  @ApiProperty()
  slug: string;
}