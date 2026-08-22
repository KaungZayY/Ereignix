import { Injectable } from '@nestjs/common';
import { RegisterUseCase } from './use-case/register.use-case';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { LoginUseCase } from './use-case/login.use-case';
import { RefreshTokenUseCase } from './use-case/refresh-token.use-case';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { LogoutUseCase } from './use-case/logout.use-case';
import { MeResponse } from './dto/me-response.dto';
import { MeUseCase } from './use-case/me.use-case';
import { AuthenticatedRequestUser } from 'src/general/decorators/current-user.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly meUseCase: MeUseCase,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    return this.registerUseCase.execute(dto);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto>{
    return this.loginUseCase.execute(dto);
  }

  async refresh(dto: RefreshTokenDto): Promise<AuthResponseDto>{
    return this.refreshTokenUseCase.execute(dto);
  }

  async logout(dto: LogoutDto): Promise<LogoutResponseDto> {
    return this.logoutUseCase.execute(dto);
  }

  async me(dto: AuthenticatedRequestUser): Promise<MeResponse>{
    return this.meUseCase.execute(dto);
  }
}
