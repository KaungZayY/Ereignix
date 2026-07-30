import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SecurityModule } from 'src/security/security.module';
import { PrismaModule } from 'src/infra/prisma/prisma.module';

@Module({
  imports: [
    SecurityModule,
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
