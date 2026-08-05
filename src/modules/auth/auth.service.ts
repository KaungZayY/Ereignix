import { Injectable } from '@nestjs/common';
import { RegisterUseCase } from './use-case/register.use-case';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { LoginUseCase } from './use-case/login.use-case';

@Injectable()
export class AuthService {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    return this.registerUseCase.execute(dto);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto>{
    return this.loginUseCase.execute(dto);
  }
}
