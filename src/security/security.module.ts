import { Module } from "@nestjs/common";
import { PasswordService } from "./password.service";
import { JwtModule } from "@nestjs/jwt";
import { TokenService } from "./token.service";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],
  providers: [PasswordService, TokenService],
  exports: [PasswordService, TokenService, JwtModule],
})
export class SecurityModule {}