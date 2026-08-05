import { Prisma } from 'generated/prisma/client';

export type UserWithMemberships = Prisma.UserGetPayload<{
  include: {
    memberships: {
      include: {
        organization: true;
      };
    };
  };
}>;
