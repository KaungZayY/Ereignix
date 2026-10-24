import { Injectable } from '@nestjs/common';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'crypto';

export interface GeneratedApiKey {
  keyId: string;
  secret: string;
  rawKey: string;
  keyHash: string;
}

@Injectable()
export class ApiKeyCryptoService {
  generate(): GeneratedApiKey {
    const keyId = randomUUID();
    const secret = randomBytes(32).toString('base64url');
    const rawKey = `evg_live_${keyId}_${secret}`;

    return {
      keyId,
      secret,
      rawKey,
      keyHash: this.hash(secret),
    };
  }

  hash(secret: string): string {
    return createHash('sha256').update(secret).digest('hex');
  }

  verify(secret: string, storedHash: string): boolean {
    const actual = Buffer.from(this.hash(secret), 'hex');
    const expected = Buffer.from(storedHash, 'hex');

    if (actual.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(actual, expected);
  }

  parse(rawKey: string): {
    keyId: string;
    secret: string;
  } | null {
    const match = /^evg_live_([0-9a-f-]{36})_([A-Za-z0-9_-]{43})$/.exec(rawKey);

    if (!match) {
      return null;
    }

    return {
      keyId: match[1],
      secret: match[2],
    };
  }
}
