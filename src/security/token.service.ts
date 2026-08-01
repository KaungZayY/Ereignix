import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

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

  async saveRefreshToen(userId: number, tokenHash: string): Promise<void> {
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
}
