import { getBaseDirectory } from '../../migrator/directories.js';
import { syncKnexAndPrismaMigrationHistory } from '../../setup/syncKnexPrismaMigrationsHistoryTemplate.mjs';

export async function syncPrismaAndKnexMigrationsHistory(
  expectedNumberOfMigrations,
) {
  console.log('T Syncing Prisma and Knex Migrations History...');
  const baseDir = getBaseDirectory();
  const syncedMigrations = await syncKnexAndPrismaMigrationHistory(baseDir);
  console.log(
    'T Synced Prisma and Knex Migrations History, migrations synced:',
    syncedMigrations,
  );

  if (syncedMigrations !== expectedNumberOfMigrations) {
    throw new Error(
      `Expected ${expectedNumberOfMigrations} migrations to be synced, but got ${syncedMigrations}`,
    );
  }

  return syncedMigrations;
}
