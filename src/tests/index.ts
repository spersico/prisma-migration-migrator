import { assert } from 'console';
import { convertPrismaMigrationsToKnexMigrations } from '../index.js';
import { cleanup } from './helpers/util-cleanup.js';
import { runKnexMigrations } from './helpers/util-knex-migrator.js';
import { runPrismaMigrations } from './helpers/util-prisma-migrator.js';
import { snapshotDbStructure } from './helpers/util-snapshot.js';
import { knexTestDbUrl, prismaDbUrl } from './helpers/test-constants.js';

// Main test function (right now it only runs one test case)
async function main() {
  console.log('Running test...');
  await cleanup();

  console.log('Running Prisma Migrations...');
  await runPrismaMigrations();
  console.log('Prisma Migrations run');

  console.log('Generating Knex Migrations...');
  await convertPrismaMigrationsToKnexMigrations();
  console.log('Knex Migrations generated');

  console.log('Running Knex Migrations...');
  await runKnexMigrations();
  console.log('Knex Migrations run');

  const prismaSnapshot = await snapshotDbStructure(prismaDbUrl);
  console.log('Prisma DB snapshot obtained');
  const knexSnapshot = await snapshotDbStructure(knexTestDbUrl);
  console.log('Knex DB snapshot obtained');

  assert(prismaSnapshot === knexSnapshot, 'DB structures do not match.');
  if (prismaSnapshot !== knexSnapshot)
    throw new Error('DB structures do not match.');
}

main()
  .catch((err) => {
    console.error('Test failed:', err);
    process.exit(1);
  })
  .then(() => {
    console.log('\x1b[32m%s\x1b[0m', 'Test passed: DB structures match.');
    process.exit(0);
  });
