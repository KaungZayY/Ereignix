import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MemberRole } from 'generated/prisma/enums';
import { UserService } from 'src/modules/user/user.service';
import { AuthenticatedRequestUser } from '../decorators/current-user.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    // No @Roles() means authentication is enough.
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedRequestUser;
    if (!user) {
      throw new ForbiddenException('User is not authenticated.');
    }

    const organizationId = Number(request.params.organizationId);
    if (!organizationId) {
      throw new ForbiddenException('Organization context is required.');
    }

    const membership = await this.userService.findMembership(
      user.id,
      organizationId,
    );
    if (!membership) {
      throw new ForbiddenException(
        'You are not a member of this organization.',
      );
    }

    if (!requiredRoles.includes(membership.role)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }

    request.membership = membership;

    return true;
  }
}
