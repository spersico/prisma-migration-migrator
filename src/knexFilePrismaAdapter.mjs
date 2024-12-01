/* eslint-disable @typescript-eslint/no-unused-vars */
import { PrismaFolderShapedMigrationSource } from './migrationSource.mjs';
import path from 'path';

/**
 * This function adapts the knexfile configuration object to use the PrismaFolderShapedMigrationSource.
 * It's what it allows us to pick up the migrations from the prisma/migrations folder.
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
    ...otherMigrationsConfigs
  } = knexfileConfig?.migrations || {};
  // Knex resets the migrationSource if any FS related config is set, so we need to remove them from the config object
  // the rest of the config object is passed as-is to the knex instance

  const migrationsBaseDirectory = directory
    ? path.join(process.cwd(), directory)
    : path.join(process.cwd(), 'prisma', 'migrations'); // default to ./prisma/migrations

  // NOTE: It's not strictly necessary to use this adapter function, you can use the PrismaFolderShapedMigrationSource directly.
  // Bear in mind though, that you'll have to provide a knex instance to it (so that it recognizes the last migration Prisma ran).
  // It's a bit of a bother. This function abstracts that for you.
  return {
    ...knexfileConfig,
    migrations: {
      ...otherMigrationsConfigs,
      migrationSource: new PrismaFolderShapedMigrationSource({
        knexfileConfig,
        migrationsBaseDirectory,
      }),
    },
  };
}
