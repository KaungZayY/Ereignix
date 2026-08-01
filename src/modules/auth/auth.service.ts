import { Injectable } from '@nestjs/common';
import { RegisterUseCase } from './use-case/register.use-case';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(private readonly registerUseCase: RegisterUseCase) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    return this.registerUseCase.execute(dto);
  }
}
