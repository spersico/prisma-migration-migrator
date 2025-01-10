import {
  access,
  lstat,
  mkdir,
  readdir,
  readFile,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { identify } from 'sql-query-identifier';
import type { IdentifyResult } from 'sql-query-identifier/lib/defines.js';

type Parameters = {
  prismaFolder?: string;
  knexMigrationsFolder?: string;
  coLocateWithPrismaMigrations?: boolean;
  silent?: boolean;
};

async function convertPrismaMigrationsToKnexMigrations(
  params?: Parameters,
): Promise<void> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const baseProjectDir = path.resolve(__dirname, '..');

  const coLocateWithPrismaMigrations = !!params?.coLocateWithPrismaMigrations;
  const prismaFolder = params?.prismaFolder || 'prisma';

  let prismaMigrationsDir, knexMigrationsDir;

  try {
    const prismaRootDir = prismaFolder
      ? path.resolve(baseProjectDir, prismaFolder)
      : path.resolve(baseProjectDir, prismaFolder);

    prismaMigrationsDir = path.join(prismaRootDir, 'migrations');
    !params.silent &&
      console.log(`> Converting Prisma migrations from ${prismaMigrationsDir}`);

    if (!coLocateWithPrismaMigrations) {
      knexMigrationsDir =
        params?.knexMigrationsFolder ||
        path.join(prismaRootDir, 'knex_migrations');
      !params.silent &&
        console.log(`> Will write Knex migrations to ${knexMigrationsDir}`);
      await mkdir(knexMigrationsDir, { recursive: true });
    } else {
      !params.silent &&
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
    prismaMigrationsDirectories = await readdir(prismaMigrationsDir).then(
      (files) =>
        Promise.all(
          files.map(async (fileName) =>
            lstat(path.join(prismaMigrationsDir, fileName)).then(
              async (stat) => {
                if (!stat.isDirectory())
                  return { skipReason: `Element is not a folder`, fileName };

                const baseSqlPath = path.join(
                  prismaMigrationsDir,
                  fileName,
                  'migration.sql',
                );

                const finalMigrationPath = coLocateWithPrismaMigrations
                  ? path.join(prismaMigrationsDir, fileName, 'migration.mjs')
                  : path.join(knexMigrationsDir, `${fileName}.mjs`);

                const alreadyExists = await access(finalMigrationPath)
                  .then(() => true)
                  .catch(() => false);

                if (alreadyExists)
                  return { skipReason: 'Migration already exists', fileName };

                return {
                  fileName,
                  baseSqlPath,
                  finalMigrationPath,
                };
              },
            ),
          ),
        ).then((dirs) => dirs.filter(({ skipReason }) => !skipReason)),
    );
  } catch (error) {
    console.error('> Error reading Prisma migrations directory:', error);
    throw error;
  }

  let migrations = [];
  try {
    migrations = await Promise.all(
      prismaMigrationsDirectories.map(({ baseSqlPath, finalMigrationPath }) =>
        readFile(baseSqlPath, 'utf-8').then((sql) => ({
          baseSqlPath,
          finalMigrationPath,
          sql,
        })),
      ),
    );
  } catch (error) {
    console.error('> Error reading Prisma migration files:', error);
    throw error;
  }

  try {
    const knexMigrations = await Promise.all(
      migrations.map(async ({ sql, finalMigrationPath }) => {
        const parsedSQL = identify(sql);
        const knexMigration = generateKnexMigration(parsedSQL);

        await writeFile(finalMigrationPath, knexMigration);
        !params.silent && console.log(`> > Generated ${finalMigrationPath}`);
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
  const prismaFolder = process.argv[2];
  convertPrismaMigrationsToKnexMigrations({ prismaFolder }).catch((err) => {
    console.error('Error:', err);
    process.exit(1);
  });
}

export { convertPrismaMigrationsToKnexMigrations };
export type { Parameters as ConvertPrismaMigrationsToKnexMigrationsParameters };
export { PrismaFolderShapedMigrationSource } from './migrationSource.mjs';
export { knexFilePrismaAdapter } from './knexFilePrismaAdapter.mjs';
