import { exec } from 'node:child_process';
import util from 'util';
import { prismaDbUrl } from './test-constants.js';

const execPromise = util.promisify(exec);

// Run Prisma migrations
export async function runPrismaMigrations() {
  const { stderr } = await execPromise('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: prismaDbUrl },
  });
  if (stderr) throw new Error(stderr);
}
