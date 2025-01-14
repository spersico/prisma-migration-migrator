import { exec } from 'node:child_process';
import util from 'util';
import { expectedInitialNumberOfMigrations } from './constants.js';

const execPromise = util.promisify(exec);

// Run Prisma migrations
export async function runPrismaMigrations(
  databaseUrl,
  expectedFoundMigrations = expectedInitialNumberOfMigrations,
) {
  console.log('T Running Prisma Migrations...');
  const { stderr, stdout } = await execPromise('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  if (
    stderr ||
    !stdout.includes(
      `${expectedFoundMigrations} migrations found in prisma/migrations`,
    )
  ) {
    console.error('T > Error running Prisma Client generate:', stdout, stderr);
    throw new Error('Error running Prisma migrations ' + stderr);
  }
  console.log('T Prisma Migrations applied');
}
