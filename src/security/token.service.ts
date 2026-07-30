import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  constructor(private readonly jwtService: JwtService) {}

  async generateAccessToken(userId: number, email: string): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
      },
      {
        expiresIn: '15m',
      },
    );
  }

  async generateRefreshToken(userId: number): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: userId,
        type: 'refresh',
      },
      {
        expiresIn: '7d',
      },
    );
  }
}
