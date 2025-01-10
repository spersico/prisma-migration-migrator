import Knex from 'knex';
import { knexFilePrismaAdapter } from '../../knexFilePrismaAdapter.mjs';

export async function runKnexMigrations(databaseUrl) {
  const knexfileConfig = {
    client: 'pg',
    connection: databaseUrl,
    migrations: {
      directory: 'prisma/migrations',
    },
  };

  const knexClient = await Knex(knexFilePrismaAdapter(knexfileConfig));
  await knexClient.migrate.latest();
  knexClient.destroy();
}
