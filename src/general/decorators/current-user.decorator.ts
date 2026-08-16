import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUser {
  id: number;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): CurrentUser => {
    const request = context.switchToHttp().getRequest();

    return request.user;
  },
);
