import { ApiProperty } from '@nestjs/swagger';
import { AuthenticatedOrganizationDto } from './authenticated-organization.dto';
import { AuthenticatedUserDto } from './authenticated-user.dto';

export class MeResponse {
  @ApiProperty({
    type: AuthenticatedUserDto,
  })
  user: AuthenticatedUserDto;

  @ApiProperty({
    type: AuthenticatedOrganizationDto
  })
  organization: AuthenticatedOrganizationDto;
}
