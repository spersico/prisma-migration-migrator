import { lstat, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { identify } from 'sql-query-identifier';
import type { IdentifyResult } from 'sql-query-identifier/lib/defines.js';

type Parameters = {
  prismaFolder?: string;
  knexMigrationsFolder?: string;
  coLocateWithPrismaMigrations?: boolean;
};

async function convertPrismaMigrationsToKnexMigrations(
  params?: Parameters,
): Promise<void> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const baseProjectDir = path.resolve(__dirname, '..');

  const coLocateWithPrismaMigrations =
    params?.coLocateWithPrismaMigrations || true;
  const prismaFolder = params?.prismaFolder || 'prisma';

  let prismaMigrationsDir, knexMigrationsDir;

  try {
    const prismaRootDir = prismaFolder
      ? path.resolve(baseProjectDir, prismaFolder)
      : path.resolve(baseProjectDir, prismaFolder);

    prismaMigrationsDir = path.join(prismaRootDir, 'migrations');
    console.log(`> Converting Prisma migrations from ${prismaMigrationsDir}`);

    if (!coLocateWithPrismaMigrations) {
      knexMigrationsDir =
        params?.knexMigrationsFolder ||
        path.join(prismaRootDir, 'knex_migrations');
      console.log(`> Will write Knex migrations to ${knexMigrationsDir}`);
      await mkdir(knexMigrationsDir, { recursive: true });
    } else {
      console.log(
        `> Will co-locate Knex migrations with Prisma migrations in the same directory`,
      );
    }
  } catch (err) {
    console.error('> Error creating knex migrations directory:', err);
    throw err;
  }

  let prismaMigrationsDirectories;
  try {
    const everythingInsidePrismaMigrations = await readdir(
      prismaMigrationsDir,
    ).then((files) =>
      Promise.all(
        files.map(async (fileName) =>
          lstat(path.join(prismaMigrationsDir, fileName)).then((stat) => ({
            fileName,
            elementPath: path.join(prismaMigrationsDir, fileName),
            stat,
          })),
        ),
      ),
    );

    prismaMigrationsDirectories = everythingInsidePrismaMigrations.filter(
      ({ stat }) => stat.isDirectory(),
    );
  } catch (error) {
    console.error('> Error reading Prisma migrations directory:', error);
    throw error;
  }

  let migrations = [];
  try {
    migrations = await Promise.all(
      prismaMigrationsDirectories.map(({ fileName }) =>
        readFile(
          path.join(prismaMigrationsDir, fileName, 'migration.sql'),
          'utf-8',
        ).then((sql) => ({ fileName, sql })),
      ),
    );
  } catch (error) {
    console.error('> Error reading Prisma migration files:', error);
    throw error;
  }

  try {
    const knexMigrations = await Promise.all(
      migrations.map(async ({ fileName, sql }) => {
        const parsedSQL = identify(sql);
        const knexMigration = generateKnexMigration(parsedSQL);
        const knexMigrationPath = coLocateWithPrismaMigrations
          ? path.join(prismaMigrationsDir, fileName, 'migration.mjs')
          : path.join(knexMigrationsDir, `${fileName}.mjs`);

        await writeFile(knexMigrationPath, knexMigration);
        console.log(`> > Generated ${knexMigrationPath}`);
      }),
    );
    console.log(
      `> Successfully converted ${knexMigrations.length} Prisma migrations to Knex migrations`,
    );
  } catch (err) {
    console.error('> Error converting migration', { migrations }, err);
    throw err;
  }
}

function generateKnexMigration(parsedSQL: IdentifyResult[]): string {
  const knexQueries = parsedSQL
    .map(
      (parsed) => `  await knex.raw(\`
${parsed.text.replace(/`/g, '\\`')}
\`);`,
    )
    .join('\n\n');

  return `/** @typedef {import('knex').Knex} Knex */

/**@param {Knex} knex*/
export async function up(knex) {
${knexQueries}
}

/**@param {Knex} knex*/
export async function down(knex) {
  // Add your down migration SQL here
}
`;
}

// If the script is run directly, execute the function with the command-line argument
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const userProvidedDir = process.argv[2];
  convertPrismaMigrationsToKnexMigrations({
    prismaFolder: userProvidedDir,
  }).catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
}

export { convertPrismaMigrationsToKnexMigrations };
export type { Parameters as ConvertPrismaMigrationsToKnexMigrationsParameters };
export { PrismaFolderShapedMigrationSource } from './migrationSource.mjs';
