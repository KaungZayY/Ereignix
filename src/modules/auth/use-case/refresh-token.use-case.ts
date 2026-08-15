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
import { RefreshTokenPayload } from 'src/general/types/token.type';


@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: RefreshTokenDto): Promise<AuthResponseDto> {
    let payload: RefreshTokenPayload = await this.tokenService.getRefreshTokenPayload(dto.refreshToken);

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
      dto.refreshToken,
      payload.jti,
    );

    await this.tokenService.revokeRefreshTokenById(storedToken.id);

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
