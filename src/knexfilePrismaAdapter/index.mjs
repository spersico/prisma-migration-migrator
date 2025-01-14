/* eslint-disable @typescript-eslint/no-unused-vars */
import { KnexMigrationSourcePrismaStyle } from './knexMigrationSourcePrismaStyle.mjs';
import path from 'node:path';

/**
 * ATTENTION: ONLY NECESSARY IF YOU WANT TO CO-LOCATE KNEX MIGRATIONS WITH PRISMA MIGRATIONS (put them in the same folder structure)
 * IF YOU PLAN TO LEAVE THE MIGRATIONS IN A SEPARATE FOLDER, YOU DON'T NEED THIS AT ALL, JUST USE KNEX NORMALLY
 * 
 * This function adapts the knexfile configuration object to use the PrismaFolderShapedMigrationSource.
 * It's what it allows us to pick up the migrations from the prisma/migrations folder (if you decide to co-locate migrations with Prisma)
 * It also allows the migrator to pick up where to put the migrated migrations.
 * 
 * The only thing that gets modified is the migrations object (https://github.com/knex/knex/blob/176151d8048b2a7feeb89a3d649a5580786d4f4e/types/index.d.ts#L3139)
 * The rest of the configuration object is passed to the knex instance.
 * 
 * If you have different environments (development/production/etc), you should be able to call this function for each of them.
 @type {import('knex').Knex.Config} knexfileConfig
 @returns {import('knex').Knex.Config}
 */
export function knexFilePrismaAdapter(knexfileConfig) {
  const {
    directory,
    sortDirsSeparately: _,
    loadExtensions: __,
    extension: ___,
    ...otherMigrationsConfigs
  } = knexfileConfig?.migrations || {};
  // Knex resets the migrationSource if any FS related config is set, so we need to remove them from the config object
  // the rest of the config object is passed as-is to the knex instance

  const migrationsBaseDirectory = directory
    ? path.join(process.cwd(), directory)
    : path.join(process.cwd(), 'prisma', 'migrations'); // default to ./prisma/migrations

  return {
    ...knexfileConfig,
    migrations: {
      ...otherMigrationsConfigs,
      migrationSource: new KnexMigrationSourcePrismaStyle({
        migrationsBaseDirectory,
      }),
    },
  };
}

export { KnexMigrationSourcePrismaStyle };
