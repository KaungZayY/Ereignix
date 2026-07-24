import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
    private static readonly SALT_ROUNDS = 12;

    async hash(password: string): Promise<string>{
        return bcrypt.hash(password, PasswordService.SALT_ROUNDS);
    }

    async verify(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword)
    }
}