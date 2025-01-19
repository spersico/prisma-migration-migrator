import Knex from 'knex';

export async function runKnexMigrations(databaseUrl, expectedRunMigrations) {
  console.log('T Running Knex Migrations...');
  const config: Knex.Knex.Config = {
    client: 'pg',
    connection: databaseUrl,
    migrations: {
      extension: 'mjs',
      loadExtensions: ['.mjs'],
      directory: 'prisma/knex_migrations',
    },
  };

  const knexClient = await Knex(config);
  const [, appliedMigrations] = await knexClient.migrate.latest();
  knexClient.destroy();

  console.log(`T Knex Migrations applied (${appliedMigrations.length})`);
  if (appliedMigrations.length !== expectedRunMigrations) {
    throw new Error(
      `Expected ${expectedRunMigrations} migrations to be applied, but got ${appliedMigrations.length}`,
    );
  }
  return appliedMigrations;
}
