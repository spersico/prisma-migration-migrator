import Knex from 'knex';
import { knexFilePrismaAdapter } from '../../knexfilePrismaAdapter/index.mjs';

export async function runKnexMigrations(databaseUrl, colocate = false) {
  console.log('T Running Knex Migrations...');
  let config: Knex.Knex.Config = {
    client: 'pg',
    connection: databaseUrl,
    migrations: {
      extension: 'mjs',
      loadExtensions: ['.mjs'],
      directory: 'prisma/knex_migrations',
    },
  };

  if (colocate) {
    config = knexFilePrismaAdapter({
      ...config,
      migrations: { directory: 'prisma/migrations' },
    });
  }

  const knexClient = await Knex(config);
  const [, appliedMigrations] = await knexClient.migrate.latest();
  knexClient.destroy();

  console.log(`T Knex Migrations applied (${appliedMigrations.length})`);

  return appliedMigrations;
}
