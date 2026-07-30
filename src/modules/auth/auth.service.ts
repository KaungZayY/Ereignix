import { Injectable, ConflictException } from '@nestjs/common';
import { PasswordService } from 'src/security/password.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { generateSlug, appendSlugSuffix } from 'src/general/utils/slug.util';
import { MemberRole } from 'generated/prisma/enums';
import { TokenService } from 'src/security/token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    let slug = generateSlug(dto.organizationName);
    let counter = 2;
    while (true) {
      const exists = await this.prisma.organization.findUnique({
        where: {
          slug,
        },
      });
      if (!exists) {
        break;
      }
      slug = appendSlugSuffix(generateSlug(dto.organizationName), counter);

      counter++;
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordHash,
        },
      });

      const organization = await tx.organization.create({
        data: {
          name: dto.organizationName,
          slug,
        },
      });

      await tx.member.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: MemberRole.OWNER,
        },
      });

      return {
        user,
        organization,
      };
    });

    const accessToken = await this.tokenService.generateAccessToken(
      result.user.id,
      result.user.email,
    );

    const refreshToken = await this.tokenService.generateRefreshToken(
      result.user.id,
    );

    const refreshTokenHash = await this.passwordService.hash(refreshToken);

    await this.prisma.refreshToken.create({
      data: {
        userId: result.user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
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
