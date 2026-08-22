import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentOrganizationId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): number => {
    const request = context.switchToHttp().getRequest();

    return request.organizationId;
  },
);
