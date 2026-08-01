import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
