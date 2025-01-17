import { knexMigrationsLockSql, knexMigrationsSQl } from './constants.js';
import {
  confirmationPrompt,
  errorLog,
  textImportant,
  textTitle,
} from './../setup/textStyles.mjs';
import path from 'node:path';
import { getBaseDirectory } from './directories.js';
import type { PrismaClient } from '@prisma/client';

const PrismatoKnexSQL = `
        INSERT INTO knex_migrations (name, batch, migration_time)
          SELECT migration_name || '.mjs', 1, finished_at
          FROM _prisma_migrations
          WHERE migration_name NOT IN (
            SELECT name
            FROM knex_migrations
          )
      `;

async function checkIfTableIsPresent(
  prisma: PrismaClient,
  tableName: '_prisma_migrations' | 'knex_migrations' | 'knex_migrations_lock',
): Promise<boolean> {
  const result = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
    `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '${tableName}') AS "exists"`,
  );
  return result[0].exists;
}

async function createKnexMigrationsTable(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(knexMigrationsSQl);
  await prisma.$executeRawUnsafe(knexMigrationsLockSql);
  const confirmExistence = await Promise.all([
    checkIfTableIsPresent(prisma, 'knex_migrations'),
    checkIfTableIsPresent(prisma, 'knex_migrations_lock'),
  ]).then((results) => results.every(Boolean));

  if (!confirmExistence)
    throw new Error(
      `Couldn't create the knex_migrations table. Something went wrong. 
      If you're using a different schema (or some custom config you've got, that modified the names of the table existence checker), 
      you might need to create the table manually.
      Without this, you can keep going with the migration, but Knex will try to run all migrations again, when you run them next time.
      `,
    );

  console.log(`> Created the knex_migrations tables.`);
}

async function syncKnexAndPrismaMigrations(
  prisma: PrismaClient,
): Promise<void> {
  const res = await prisma.$executeRawUnsafe<number>(PrismatoKnexSQL);
  console.log(`> > Synced ${res} migrations from Prisma to Knex`);
}

export async function syncMigrationTables(): Promise<void> {
  const continues = await confirmationPrompt(
    `${textTitle('-------------------------\nKnex-Prisma History Sync\n---------------------------')}
Optionally, you can update your Knex Migrations table with the migrations that Prisma has already applied.
That way, if in your project you have already run migrations with Prisma, you can keep track of them.

To do this, the script will check in the DB connected to the local @prisma/client if the tables '_prisma_migrations' and 'knex_migrations' exist.
If they don't, it will create them for you. Then, it will copy the migrations from the Prisma Migrations history table to knex_migrations.

${textImportant('REMEMBER: This only affects the current DB connected to your local Prisma Client. If you have multiple DBs, you will need to run this command for each one.')}


The command that will be run is:

${textImportant(PrismatoKnexSQL)}

---

Do you wish to proceed?`,
    `This means that knex won't know about the migrations that Prisma has already applied. If you've got issues with knex, check how to fill the knex_migrations table with the migrations that Prisma has already applied.`,
  );
  if (!continues) return;

  console.log(
    `> About to sync Knex's migration-tracking table with Prisma's migration table`,
  );
  let prisma;
  try {
    const baseDir = getBaseDirectory();
    const localPrismaClientDep = await import(
      path.resolve(baseDir, 'node_modules', '@prisma/client/default.js')
    );
    if (!localPrismaClientDep && localPrismaClientDep.PrismaClient) {
      errorLog('Prisma Client not found in the project');
      return;
    }
    prisma = new localPrismaClientDep.PrismaClient();
  } catch (error) {
    console.error(error);
    throw new Error(
      `Couldn't load the Prisma Client. Make sure you have it installed in your project. Error: ${error.message}`,
    );
  }

  try {
    await prisma.$connect();
    const [prismaHistory, knexHistory] = await Promise.all([
      checkIfTableIsPresent(prisma, '_prisma_migrations'),
      checkIfTableIsPresent(prisma, 'knex_migrations'),
    ]);

    if (!prismaHistory) {
      console.log(
        '\x1b[32m%s\x1b[0m',
        '> Prisma history table not present. Looks like you never used Prisma to run migrations. Skipping migration sync',
      );
      return;
    }

    if (!knexHistory) {
      console.log(
        '\x1b[32m%s\x1b[0m',
        `> Knex history table not present.
        This is expected if you haven't ran any Knex migrations yet.
        Knex usually creates this table automatically, when you run the first migration.
        But we need it now, to sync the migrations previously applied by Prisma. I'll create it for you.`,
      );
      await createKnexMigrationsTable(prisma);
      console.log(`> Created Knex's migration-tracking table`);
    } else {
      console.log(`> Knex's migration-tracking table is present`);
    }

    await syncKnexAndPrismaMigrations(prisma);
    console.log(
      `> Successfully synced Knex's migration-tracking table with Prisma's migration table`,
    );
  } catch (error) {
    throw error;
  } finally {
    prisma.$disconnect();
  }
}
