import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/modules/user/user.service';
import { TokenService } from 'src/security/token.service';

interface RefreshTokenPayload {
  sub: number;
  type: string;
  jti: string;
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    let payload: RefreshTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        dto.refreshToken,
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (payload.type !== 'refresh' || !payload.jti) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const user = await this.userService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token.');
    }
    const membership = user.memberships.at(0);
    if (!membership) {
      throw new InternalServerErrorException(
        'User is not assigned to an organization.',
      );
    }

    const storedToken = await this.tokenService.findValidRefreshToken(
      user.id,
      dto.refreshToken,
      payload.jti,
    );

    await this.tokenService.revokeRefreshToken(storedToken.id);

    const tokenPair = await this.tokenService.issueTokenPair(
      user.id,
      user.email,
    );

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
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
