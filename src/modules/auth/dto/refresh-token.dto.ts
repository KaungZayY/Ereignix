import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenDto {
  @ApiProperty({
    example: 'pAsteReFreshtoKen...',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}