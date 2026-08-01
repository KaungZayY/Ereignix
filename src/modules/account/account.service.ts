import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { MemberRole } from 'generated/prisma/enums';

@Injectable()
export class AccountService {
  constructor(private readonly prisma: PrismaService) {}

  async createAccount(params: {
    name: string;
    email: string;
    passwordHash: string;
    organizationName: string;
    slug: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: params.name,
          email: params.email,
          passwordHash: params.passwordHash,
        },
      });

      const organization = await tx.organization.create({
        data: {
          name: params.organizationName,
          slug: params.slug,
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
  }
}
