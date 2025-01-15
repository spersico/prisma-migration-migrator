import { PrismaClient } from '@prisma/client';
import { knexMigrationsLockSql, knexMigrationsSQl } from './constants.js';

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
  const res = await prisma.$executeRawUnsafe<number>(`
        INSERT INTO knex_migrations (name, batch, migration_time)
          SELECT migration_name || '.mjs', 1, finished_at
          FROM _prisma_migrations
          WHERE migration_name NOT IN (
            SELECT name
            FROM knex_migrations
          )
      `);
  console.log(`> > Synced ${res} migrations from Prisma to Knex`);
}

export async function syncMigrationTables(): Promise<void> {
  console.log(
    `> About to sync Knex's migration-tracking table with Prisma's migration table`,
  );
  const prisma = new PrismaClient();

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
