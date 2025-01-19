import Knex from 'knex';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

async function findKnexfile(baseDir) {
  const files = await readdir(baseDir);
  const knexfile = files.find((file) => file.startsWith('knexfile'));
  return knexfile ? path.join(baseDir, knexfile) : null;
}

async function getKnexClient(baseDir) {
  const knexConfigPath = await findKnexfile(baseDir);
  if (!knexConfigPath) {
    throw new Error('No knexfile found in the project');
  }
  const knexConfig = await import(knexConfigPath);
  if (!knexConfig.default) {
    throw new Error('No default export found in knexfile');
  }
  console.log('Knex configuration found');
  return Knex(knexConfig.default);
}

async function syncKnexAndPrismaMigrationHistory(baseDir = './') {
  console.log('Syncing knex and prisma migration history');
  const knexClient = await getKnexClient(baseDir);
  console.log('Knex client created');

  const [prisma, knex_migrations, knex_lock] = await Promise.all([
    knexClient.schema.hasTable('_prisma_migrations'),
    knexClient.schema.hasTable('knex_migrations'),
    knexClient.schema.hasTable('knex_migrations_lock'),
  ]);

  if (!prisma) {
    console.warn('Prisma migrations table not found - Skipping sync');
    return 0;
  }

  if (!knex_migrations) {
    console.log('Knex migrations table not found - Creating table');
    await knexClient.schema.createTable('knex_migrations', function (table) {
      table.increments('id').primary();
      table.string('name');
      table.integer('batch');
      table.timestamp('migration_time');
    });
    console.log(`Created Knex's migration-tracking table`);
  }

  if (!knex_lock) {
    console.log('Knex migrations_lock table not found - Creating table');
    await knexClient.schema.createTable(
      'knex_migrations_lock',
      function (table) {
        table.increments('index').primary();
        table.integer('is_locked');
      },
    );
    console.log(`Created Knex's migrations_lock table`);
  }

  console.log('Syncing knex and prisma migration history');
  const result = await knexClient.raw(`
INSERT INTO knex_migrations (name, batch, migration_time)
  SELECT CONCAT(migration_name, '.mjs'), 1, finished_at
  FROM _prisma_migrations
  WHERE migration_name NOT IN (
    SELECT name
    FROM knex_migrations
  )
`);
  console.log('Sync complete');
  return result?.rowCount || 0;
}

async function syncMigrations() {
  try {
    const baseDir = process.cwd();
    await syncKnexAndPrismaMigrationHistory(baseDir);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  syncMigrations();
}

export { syncKnexAndPrismaMigrationHistory };
