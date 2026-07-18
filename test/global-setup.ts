import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

export default async () => {
  dotenv.config({
    path: '.env.test.local',
    override: true,
  });

  execSync('npx prisma migrate deploy', {
    env: process.env,
    stdio: 'inherit',
  });
};