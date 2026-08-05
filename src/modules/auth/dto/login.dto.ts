import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength, MaxLength } from "class-validator";

export class LoginDto {
  @ApiProperty({
    example: 'john@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123!',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;
}
