import { access, readdir } from 'fs/promises';
import path from 'node:path';

/**
 * This migration source is designed to pick up Migration files arranged in folder, Prisma-style.
 */
export class KnexMigrationSourcePrismaStyle {
  migrationsBaseDirectory;

  constructor({ migrationsBaseDirectory }) {
    this.migrationsBaseDirectory = migrationsBaseDirectory;
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

    return availableMigrations;
  }

  getMigrationName(migration) {
    return migration.name;
  }

  async getMigration(migration) {
    return import(migration.migrationPath);
  }
}
