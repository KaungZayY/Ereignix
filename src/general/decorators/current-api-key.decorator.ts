import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyContext, ApiKeyRequest } from '../guards/api-key-auth.guard';

export const CurrentApiKey = createParamDecorator(
  (_data: unknown, context: ExecutionContext): ApiKeyContext => {
    const request = context.switchToHttp().getRequest<ApiKeyRequest>();

    if (!request.apiKey) {
      throw new UnauthorizedException('API key context is unavailable.');
    }

    return request.apiKey;
  },
);
