import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SecurityModule } from 'src/security/security.module';
import { PrismaModule } from 'src/infra/prisma/prisma.module';
import { OrganizationModule } from '../organization/organization.module';
import { UserModule } from '../user/user.module';
import { AccountModule } from '../account/account.module';
import { RegisterUseCase } from './use-case/register.use-case';
import { LoginUseCase } from './use-case/login.use-case';

@Module({
  imports: [
    SecurityModule,
    PrismaModule,
    OrganizationModule,
    UserModule,
    AccountModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, RegisterUseCase, LoginUseCase],
})
export class AuthModule {}
