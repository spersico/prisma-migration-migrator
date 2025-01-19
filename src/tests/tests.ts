import { addFieldToPrismaSchema } from './helpers/util-add-field-to-schema.js';
import { cleanup } from './helpers/util-cleanup.js';
import { runKnexMigrations } from './helpers/util-knex-migrator.js';
import { runPrismaMigrations } from './helpers/util-prisma-migrator.js';
import { snapshotDbStructure } from './helpers/util-snapshot.js';
import type { TestParameters } from './helpers/types.js';
import { testDbUrl as dbUrl, knexMigrationsDir } from './helpers/constants.js';

import { runPrismaClientReGenerate } from './helpers/util-prisma-regenerate-client.js';
import { migrator } from '../migrator/index.js';
import { syncPrismaAndKnexMigrationsHistory } from './helpers/util-prisma-knex-sync-history.js';

async function test(parameters: TestParameters) {
  const {
    dbUrl,
    silent = false,
    skipInitialPrismaMigrationRun = false,
  } = parameters;
  console.log(`T Test parameters:`, parameters);
  await cleanup(silent);

  const expectedNumberOfMigrations = {
    prisma: skipInitialPrismaMigrationRun ? 0 : 2,
    knex: skipInitialPrismaMigrationRun ? 2 : 0,
  };

  !skipInitialPrismaMigrationRun && (await runPrismaMigrations(dbUrl));

  console.log('T Conversion started');
  await migrator({
    silent,
    knexMigrationsDir,
  });
  console.log('T Conversion completed');
  console.log('T Syncing Prisma and Knex Migrations History...');
  await syncPrismaAndKnexMigrationsHistory(expectedNumberOfMigrations.prisma);
  console.log('T Prisma and Knex Migrations History synced successfully.');

  await runKnexMigrations(dbUrl, expectedNumberOfMigrations.knex);
  const prismaState = await snapshotDbStructure(dbUrl);
  const knexState = await snapshotDbStructure(dbUrl);

  if (prismaState !== knexState) throw new Error('DB structures do not match.');

  await runPrismaClientReGenerate();
  console.log('T Prisma client regenerated successfully.');

  await addFieldToPrismaSchema();
  await runPrismaClientReGenerate();
}

const acceptanceCases: TestParameters[] = [
  { dbUrl },
  { dbUrl, skipInitialPrismaMigrationRun: true },
];

async function executeAllTests() {
  try {
    for await (const parameters of acceptanceCases) {
      console.group('Running test');
      await test(parameters);
      console.groupEnd();
      console.log(`\x1b[32mTest pass\x1b[0m`);
    }

    console.log(`\x1b[32mAll tests passed\x1b[0m`);

    process.exit(0);
  } catch (error) {
    console.error(`\x1b[31mError running tests\x1b[0m`, error);
    process.exit(1);
  }
}

executeAllTests();
