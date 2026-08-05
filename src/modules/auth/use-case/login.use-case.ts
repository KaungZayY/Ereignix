import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { UserService } from 'src/modules/user/user.service';
import { PasswordService } from 'src/security/password.service';
import { TokenService } from 'src/security/token.service';

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.userService.getUserByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const membership = user.memberships.at(0);
    if (!membership) {
      throw new InternalServerErrorException(
        'User is not assigned to an organization.',
      );
    }

    const isPwdMatches = await this.passwordService.verify(
      dto.password,
      user.passwordHash,
    );
    if (!isPwdMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

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
