import { addFieldToPrismaSchema } from './helpers/util-add-field-to-schema.js';
import { cleanup } from './helpers/util-cleanup.js';
import { runKnexMigrations } from './helpers/util-knex-migrator.js';
import { runPrismaMigrations } from './helpers/util-prisma-migrator.js';
import { snapshotDbStructure } from './helpers/util-snapshot.js';
import type { TestParameters } from './helpers/types.js';
import { testDbUrl as dbUrl, knexMigrationsDir } from './helpers/constants.js';

import { runPrismaClientReGenerate } from './helpers/util-prisma-regenerate-client.js';
import { migrator } from '../migrator/index.js';

async function test(parameters: TestParameters) {
  const {
    dbUrl,
    colocate = false,
    silent = false,
    skipInitialPrismaMigrationRun = false,
  } = parameters;
  console.log(`T Test parameters:`, parameters);
  await cleanup(colocate, silent);

  !skipInitialPrismaMigrationRun && (await runPrismaMigrations(dbUrl));

  console.log('T Conversion started');
  await migrator({
    colocate,
    silent,
    knexMigrationsDir,
  });
  console.log('T Conversion completed');

  const migrationsByKnex = await runKnexMigrations(dbUrl, colocate);

  const prismaState = await snapshotDbStructure(dbUrl);
  const knexState = await snapshotDbStructure(dbUrl);

  if (prismaState !== knexState) throw new Error('DB structures do not match.');
  if (skipInitialPrismaMigrationRun && migrationsByKnex.length === 0) {
    throw new Error('No migrations were applied, when they should have been.');
  } else if (!skipInitialPrismaMigrationRun && migrationsByKnex.length === 2) {
    throw new Error(
      'Migrations that were supposed to be skipped were applied instead.',
    );
  }

  await runPrismaClientReGenerate();
  console.log('T Prisma client regenerated successfully.');

  await addFieldToPrismaSchema();
  await runPrismaClientReGenerate();
}

const acceptanceCases: TestParameters[] = [
  { dbUrl },
  { dbUrl, skipInitialPrismaMigrationRun: true },
  { dbUrl, colocate: true },
  {
    dbUrl,
    colocate: true,
    skipInitialPrismaMigrationRun: true,
  },
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
