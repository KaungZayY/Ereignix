import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedRequestUser {
  id: number;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedRequestUser => {
    const request = context.switchToHttp().getRequest();

    return request.user;
  },
);
