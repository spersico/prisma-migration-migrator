import { convertPrismaMigrationsToKnexMigrations } from '../../index.js';
import { cleanup } from '../helpers/util-cleanup.js';
import { runKnexMigrations } from '../helpers/util-knex-migrator.js';
import { runPrismaMigrations } from '../helpers/util-prisma-migrator.js';
import { snapshotDbStructure } from '../helpers/util-snapshot.js';
import type { TestParameters } from '../types.js';

export default async function main(parameters: TestParameters) {
  const { strategy, dbUrl, altDbUrl = dbUrl, silent = false } = parameters;
  await cleanup(strategy, silent);

  console.log('Running Prisma Migrations...');
  await runPrismaMigrations(dbUrl);

  console.log('Generating Knex Migrations...');
  await convertPrismaMigrationsToKnexMigrations({
    coLocateWithPrismaMigrations: strategy === 'co-located',
  });
  console.log('Knex Migrations generated');

  console.log('Running Knex Migrations...');
  await runKnexMigrations(altDbUrl);
  console.log('Knex Migrations applied');

  const prismaState = await snapshotDbStructure(dbUrl);
  const knexState = await snapshotDbStructure(altDbUrl);
  if (prismaState !== knexState) throw new Error('DB structures do not match.');
}
