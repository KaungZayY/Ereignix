import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/modules/user/user.service';
import type { AuthenticatedRequestUser } from 'src/general/decorators/current-user.decorator';
import { MeResponse } from '../dto/me-response.dto';

@Injectable()
export class MeUseCase {
  constructor(private readonly userService: UserService) {}

  async execute(authUser: AuthenticatedRequestUser): Promise<MeResponse> {
    const user = await this.userService.findById(authUser.id);
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }

    const membership = user.memberships[0];
    if (!membership) {
      throw new UnauthorizedException(
        'User does not belong to an organization.',
      );
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
      },
    };
  }
}
