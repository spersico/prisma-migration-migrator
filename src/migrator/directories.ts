import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { MigratorParameters } from './types.js';
import { findKnexfile } from './knexfileFinder.js';

/**
 * ONLY USED for standalone migrations.
 * Get the migrations directory from the Knex configuration (`knexfile`) or the `knexfilePath` parameter
 *
 * For co-located migrations, the directory is the same as the Prisma migrations directory
 */
async function getKnexStandaloneMigrationsDirectory(
  params: MigratorParameters,
  baseDir: string,
): Promise<string | null> {
  let knexfilePath;

  if (params.knexMigrationsDir) {
    return path.resolve(baseDir, params.knexMigrationsDir);
  } else if (params?.knexfilePath) {
    knexfilePath = path.resolve(baseDir, params.knexfilePath);
  } else {
    knexfilePath = await findKnexfile(baseDir);
  }

  if (!knexfilePath) {
    console.error('Knexfile not found in the project directory.');
    return null;
  }

  try {
    const knexConfig = await import(knexfilePath);
    const knexConfigData = knexConfig.default || knexConfig;
    if (!knexConfigData) {
      console.error(
        `Knexfile not found in the project directory. 
        BEWARE: You need to specify the migrations extension in the Knex configuration for mjs files. Maybe use the setup script included in this package?.
        Will use known default: <project-root>/migrations`,
      );
      return path.resolve(baseDir, 'migrations');
    }

    const migrationsDir =
      knexConfig.default?.migrations?.directory ||
      knexConfig.migrations?.directory;

    if (!migrationsDir) {
      console.error(
        `Migrations property not found in the Knex configuration. 
        BEWARE: You need to specify the migrations extension in the Knex configuration for mjs files. Maybe use the setup script included in this package?. 
        Otherwise, check the knexfile of this library for a working example.
        Using known default: <project-root>/migrations`,
      );
      return path.resolve(baseDir, 'migrations');
    }
    const knexMigrationsDirectory = path.resolve(baseDir, migrationsDir);

    console.log('> Knex migrations:', knexMigrationsDirectory);
    return knexMigrationsDirectory;
  } catch (error) {
    console.error('Error importing the Knexfile:', error);
    return null;
  }
}

export function getBaseDirectory() {
  const __filename = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(__filename), '..', '..');
}

/**
 * Gets the base directory where Prisma migrations can be found, and the directory where Knex migrations will be written
 */
export async function resolveMigrationDirectories(params?: MigratorParameters) {
  const baseDir = getBaseDirectory();

  let prismaMigrationsDir, knexMigrationsDir;
  try {
    prismaMigrationsDir = path.join(
      path.resolve(baseDir, params?.prismaFolderPath || 'prisma'),
      'migrations',
    );
    console.log(`> > Converting Prisma migrations from ${prismaMigrationsDir}`);

    if (!params?.colocate) {
      knexMigrationsDir = await getKnexStandaloneMigrationsDirectory(
        params,
        baseDir,
      );
      if (!knexMigrationsDir) {
        throw new Error('Knex migrations directory not found');
      }
      console.log(
        `> > Will locate converted migrations in the directory: ${knexMigrationsDir}`,
      );
      await mkdir(knexMigrationsDir, { recursive: true });
    } else {
      console.log(
        `> > Will co-locate converted migrations with Prisma migrations in the same directory`,
      );
    }
  } catch (err) {
    console.error('> Error resolving migration directories:', err);
    throw err;
  }

  return { prismaMigrationsDir, knexMigrationsDir };
}
