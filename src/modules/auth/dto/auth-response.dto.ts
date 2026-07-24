import { ApiProperty } from '@nestjs/swagger';
import { AuthenticatedOrganizationDto } from './authenticated-organization.dto';
import { AuthenticatedUserDto } from './authenticated-user.dto';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty({
    type: AuthenticatedUserDto,
  })
  user: AuthenticatedUserDto;

  @ApiProperty({
    type: AuthenticatedOrganizationDto
  })
  organization: AuthenticatedOrganizationDto;
}
