import { knexTestDbUrl } from './test-constants.js';
import Knex from 'knex';
import { knexFilePrismaAdapter } from '../../knexFilePrismaAdapter.mjs';

export async function runKnexMigrations() {
  const knexfileConfig = {
    client: 'pg',
    connection: knexTestDbUrl,
    migrations: {
      directory: 'prisma/migrations',
    },
  };

  const knexClient = await Knex(knexFilePrismaAdapter(knexfileConfig));
  await knexClient.migrate.latest();
}
