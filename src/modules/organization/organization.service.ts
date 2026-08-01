import { Injectable } from '@nestjs/common';
import { generateSlug, appendSlugSuffix } from 'src/general/utils/slug.util';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async createUniqueslug(organizationName: string): Promise<string> {
    let slug = generateSlug(organizationName);
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
      slug = appendSlugSuffix(generateSlug(organizationName), counter);

      counter++;
    }
    return slug;
  }
}
