import { Injectable } from '@nestjs/common';
import { TokenService } from 'src/security/token.service';
import { LogoutDto } from '../dto/logout.dto';
import { LogoutResponseDto } from '../dto/logout-response.dto';
import { RefreshTokenPayload } from 'src/general/types/token.type';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: LogoutDto): Promise<LogoutResponseDto> {
    await this.tokenService.revokeRefreshToken(dto.refreshToken);
    return {
      message: 'Logged out successfully.',
    };
  }
}
