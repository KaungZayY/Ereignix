import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';

@Injectable()
export class WebhookSecretService {
  private readonly encryptionKey: Buffer;

  constructor() {
    const encodedKey = process.env.WEBHOOK_ENCRYPTION_KEY;

    if (!encodedKey) {
      throw new Error(
        'WEBHOOK_ENCRYPTION_KEY environment variable is required.',
      );
    }

    const key = Buffer.from(encodedKey, 'base64');

    if (key.length !== 32) {
      throw new Error(
        'WEBHOOK_ENCRYPTION_KEY must be a valid base64-encoded 32-byte key.',
      );
    }

    this.encryptionKey = key;
  }

  encrypt(plainText: string): string {
    const iv = randomBytes(12);

    const cipher = createCipheriv(ALGORITHM, this.encryptionKey, iv);

    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return [
      VERSION,
      iv.toString('base64url'),
      authTag.toString('base64url'),
      encrypted.toString('base64url'),
    ].join('.');
  }

  decrypt(encryptedValue: string): string {
    if (!encryptedValue.startsWith(`${VERSION}.`)) {
      throw new InternalServerErrorException(
        'Invalid encrypted webhook secret format.',
      );
    }

    try {
      const [version, ivValue, authTagValue, encryptedData] =
        encryptedValue.split('.');

      if (version !== VERSION || !ivValue || !authTagValue || !encryptedData) {
        throw new Error('Invalid encrypted secret format.');
      }

      const decipher = createDecipheriv(
        ALGORITHM,
        this.encryptionKey,
        Buffer.from(ivValue, 'base64url'),
      );

      decipher.setAuthTag(Buffer.from(authTagValue, 'base64url'));

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedData, 'base64url')),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch {
      throw new InternalServerErrorException(
        'Could not decrypt webhook secret.',
      );
    }
  }
}
