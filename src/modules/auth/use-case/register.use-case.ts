import { Injectable } from '@nestjs/common';
import { PasswordService } from 'src/security/password.service';
import { TokenService } from 'src/security/token.service';
import { OrganizationService } from 'src/modules/organization/organization.service';
import { UserService } from 'src/modules/user/user.service';
import { AccountService } from 'src/modules/account/account.service';
import { RegisterDto } from '../dto/register.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly organizationService: OrganizationService,
    private readonly userService: UserService,
    private readonly accountService: AccountService,
  ) {}
  
  async execute(dto: RegisterDto): Promise<AuthResponseDto> {

    await this.userService.ensureUniqueEmailOrThrowException(dto.email);

    const slug = await this.organizationService.createUniqueslug(
      dto.organizationName,
    );

    const passwordHash = await this.passwordService.hash(dto.password);
    const result = await this.accountService.createAccount({
      name: dto.name,
      email: dto.email,
      passwordHash,
      organizationName: dto.organizationName,
      slug,
    });

    const tokenPair = await this.tokenService.issueTokenPair(result.user.id, result.user.email);

    return {
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
      organization: {
        id: result.organization.id,
        name: result.organization.name,
        slug: result.organization.slug,
      },
    };
  }
}
