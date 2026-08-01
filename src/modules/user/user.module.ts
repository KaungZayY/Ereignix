import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaModule } from 'src/infra/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
