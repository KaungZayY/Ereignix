import { Injectable, ConflictException } from '@nestjs/common';
import { UserWithMemberships } from 'src/general/types/user.type';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureUniqueEmailOrThrowException(email: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }
  }

  async getUserByEmail(email: string): Promise<UserWithMemberships | null> {
    const user: UserWithMemberships | null = await this.prisma.user.findUnique({
      where: {
        email,
      },
      include: {
      memberships: {
        include: {
          organization: true,
        },
      },
    },
    });
    return user;
  }
}
