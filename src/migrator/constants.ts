export const knexMigrationsSQl = `
CREATE TABLE "knex_migrations" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(255),
  "batch" INTEGER,
  "migration_time" TIMESTAMPTZ
);`;

export const knexMigrationsLockSql = `
CREATE TABLE "knex_migrations_lock" (
  "index" SERIAL PRIMARY KEY,
  "is_locked" INTEGER
);`;
