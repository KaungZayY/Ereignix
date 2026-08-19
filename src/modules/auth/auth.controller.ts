import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { LogoutResponseDto } from './dto/logout-response.dto';
import { MeResponse } from './dto/me-response.dto';
import { CurrentUser } from 'src/general/decorators/current-user.decorator';
import type { CurrentUserPayload } from 'src/general/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/general/guards/jwt-auth.guard';

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

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access and refresh tokens',
  })
  @ApiOkResponse({
    type: AuthResponseDto,
  })
  async refreshToken(
    @Body() dto: RefreshTokenDto,
  ): Promise<AuthResponseDto> {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'LogOut',
  })
  @ApiOkResponse({
    type: LogoutResponseDto,
  })
  async logout(@Body() dto: LogoutDto): Promise<LogoutResponseDto> {
    return this.authService.logout(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'get current user',
  })
  @ApiOkResponse({
    type: MeResponse,
  })
  async getMe(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.me(user)
  }
}
