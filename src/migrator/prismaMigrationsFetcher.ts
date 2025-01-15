import { access, lstat, readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import type { MigrationData, MigratorParameters } from './types.js';
import { resolveMigrationDirectories } from './directories.js';
import { identify } from 'sql-query-identifier';

export function calculateChecksum(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

export async function getMigrationsToMigrate(
  params: MigratorParameters,
): Promise<MigrationData[]> {
  const { prismaMigrationsDir, knexMigrationsDir } =
    await resolveMigrationDirectories(params);

  let prismaMigrationsDirectories;
  try {
    prismaMigrationsDirectories = await readdir(prismaMigrationsDir).then(
      (files) =>
        Promise.all(
          files.map(async (name) =>
            lstat(path.join(prismaMigrationsDir, name)).then(async (stat) => {
              if (!stat.isDirectory())
                return {
                  skipReason: `Element is not a folder`,
                  name,
                };

              const baseSqlPath = path.join(
                prismaMigrationsDir,
                name,
                'migration.sql',
              );

              const finalMigrationPath = path.join(
                knexMigrationsDir,
                `${name}.mjs`,
              );

              const alreadyExists = await access(finalMigrationPath)
                .then(() => true)
                .catch(() => false);

              if (alreadyExists)
                return {
                  skipReason: 'A migration with the same name already exists',
                  name,
                };

              return {
                name,
                baseSqlPath,
                finalMigrationPath,
              };
            }),
          ),
        ).then((dirs) => dirs.filter(({ skipReason }) => !skipReason)),
    );
  } catch (error) {
    console.error('> Error reading Prisma migrations directory:', error);
    throw error;
  }

  let migrations: Array<MigrationData> = [];
  try {
    migrations = await Promise.all(
      prismaMigrationsDirectories.map(
        ({ baseSqlPath, finalMigrationPath, name }) =>
          readFile(baseSqlPath, 'utf-8').then((sql) => ({
            name,
            baseSqlPath,
            finalMigrationPath,
            sql: identify(sql),
            checksum: calculateChecksum(sql),
          })),
      ),
    );
  } catch (error) {
    console.error('> Error reading Prisma migration files:', error);
    throw error;
  }

  return migrations;
}
