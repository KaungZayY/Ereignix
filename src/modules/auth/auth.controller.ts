import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@ApiTags('Authentication')
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new account',
  })
  @ApiCreatedResponse({
    type: AuthResponseDto,
  })
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto)
  }

  @Post('login')
  @ApiOperation({
    summary: 'login user and issue access token'
  })
  @ApiCreatedResponse({
    type: AuthResponseDto,
  })
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }
}
