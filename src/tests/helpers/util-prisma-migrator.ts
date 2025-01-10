import { exec } from 'node:child_process';
import util from 'util';

const execPromise = util.promisify(exec);

// Run Prisma migrations
export async function runPrismaMigrations(databaseUrl) {
  const { stderr } = await execPromise('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });
  if (stderr) throw new Error(stderr);
}
