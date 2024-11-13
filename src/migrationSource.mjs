import { access, readdir } from 'fs/promises';
import path from 'node:path';

/**
 * This migration source is designed to pick up Migration files arranged in folder, Prisma-style.
 *
 * This is useful when you want to keep your migration files, colocated with both the Prisma schema and the Prisma migrations.
 * This is also what filters out migrations that have already been applied by Prisma (optional).
 *
 * If you use skipPrismaMigrationsCheck, you don't need to provide a knex instance.
 */
export class PrismaFolderShapedMigrationSource {
  migrationsBaseDirectory;

  constructor({
    knexInstance,
    migrationsBaseDirectory,
    silent = true,
    skipPrismaMigrationsCheck = false,
  }) {
    this.knex = knexInstance;
    this.migrationsBaseDirectory = migrationsBaseDirectory;
    this.silent = silent;
    this.skipPrismaMigrationsCheck = !!skipPrismaMigrationsCheck;
  }

  async filterPrismaMigrations(migrations) {
    try {
      const preAppliedMigrations =
        await this.knex('_prisma_migrations').pluck('migration_name');

      return migrations.filter(
        ({ name }) => !preAppliedMigrations.includes(name),
      );
    } catch (error) {
      if (error.code === '42P01') {
        console.warn(
          `\x1b[33mCouldn't find the _prisma_migrations table. This is expected if you haven't used Prisma for migrations yet.\x1b[0m`,
        );
      } else {
        throw error;
      }
    }
    return migrations;
  }

  async getMigrations() {
    const migrationSubDirectories = await readdir(
      this.migrationsBaseDirectory,
      { withFileTypes: true },
    ).then((entries) => entries.filter((entry) => entry.isDirectory()));

    const availableMigrations = await Promise.all(
      migrationSubDirectories.map(({ name }) => {
        const migrationPath = path.join(
          this.migrationsBaseDirectory,
          name,
          'migration.mjs',
        );

        return access(migrationPath)
          .then(() => ({
            name,
            migrationPath,
          }))
          .catch(() => null);
      }),
    ).then((migrations) => migrations.filter(Boolean));

    if (this.skipPrismaMigrationsCheck) return availableMigrations;

    const filteredMigrations =
      await this.filterPrismaMigrations(availableMigrations);

    return filteredMigrations;
  }

  getMigrationName(migration) {
    return migration.name;
  }

  async getMigration(migration) {
    if (!this.silent) console.log(`> About to apply migration: `, migration);
    return import(migration.migrationPath);
  }
}
