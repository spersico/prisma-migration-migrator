import { knexMigrationsWriter } from './knexMigrationsWriter.js';
import { getMigrationsToMigrate } from './prismaMigrationsFetcher.js';
import { syncMigrationTables } from './syncMigrationTables.js';
import type { MigratorParameters } from './types.js';

export async function migrator(params?: MigratorParameters): Promise<void> {
  const migrations = await getMigrationsToMigrate(params);
  await knexMigrationsWriter(migrations);
  await syncMigrationTables(params);
}
