import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test.local', override: true });

if (!process.env.DATABASE_URL?.includes('test')) {
  throw new Error('Wrong DB detected');
}
