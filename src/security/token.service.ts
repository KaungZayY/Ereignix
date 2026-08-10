import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { PasswordService } from './password.service';
import { randomUUID } from 'crypto';

@Injectable()
export class TokenService {
  private static readonly ACCESS_TOKEN_EXPIRY = '15m';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';
  private static readonly REFRESH_TOKEN_EXPIRY_DAYS = 7;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
  ) {}

  async generateAccessToken(userId: number, email: string): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
      },
      {
        expiresIn: TokenService.ACCESS_TOKEN_EXPIRY,
      },
    );
  }

  async generateRefreshToken(
    userId: number,
  ): Promise<{ token: string; jti: string }> {
    const jti = randomUUID();
    const token = await this.jwtService.signAsync(
      {
        sub: userId,
        type: 'refresh',
        jti,
      },
      {
        expiresIn: TokenService.REFRESH_TOKEN_EXPIRY,
      },
    );
    return {
      token,
      jti,
    };
  }

  async saveRefreshToken(userId: number, refreshToken: string, jti: string,): Promise<void> {
    const tokenHash = await this.passwordService.hash(refreshToken);
    const expiresAt = new Date(
      Date.now() + TokenService.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );
    await this.prisma.refreshToken.create({
      data: {
        userId,
        jti,
        tokenHash,
        expiresAt,
      },
    });
  }

  async issueTokenPair(
    userId: number,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = await this.generateAccessToken(userId, email);

    const { token: refreshToken, jti } = await this.generateRefreshToken(userId);

    await this.saveRefreshToken(userId, refreshToken, jti);

    return {
      accessToken,
      refreshToken,
    };
  }

  async findValidRefreshToken(userId: number, refreshToken: string, jti: string) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        jti,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    for (const token of tokens) {
      const matches = await this.passwordService.verify(
        refreshToken,
        token.tokenHash,
      );

      if (matches) {
        return token;
      }
    }

    throw new UnauthorizedException('Invalid or expired refresh token.');
  }

  async revokeRefreshToken(id: number) {
    const result = await this.prisma.refreshToken.update({
      where: {
        id,
      },
      data: {
        revokedAt: new Date(),
      },
    });
    return result;
  }
}
