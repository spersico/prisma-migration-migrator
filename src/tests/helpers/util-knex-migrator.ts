import path from 'node:path';
import { PrismaFolderShapedMigrationSource } from '../../migrationSource.mjs';
import { knexTestDbUrl } from './test-constants.js';
import Knex from 'knex';

export async function runKnexMigrations() {
  const baseConfig = {
    client: 'pg',
    connection: knexTestDbUrl,
  };

  const knexInstance = Knex(baseConfig);

  const config = {
    ...baseConfig,
    migrations: {
      migrationSource: new PrismaFolderShapedMigrationSource({
        skipPrismaMigrationsCheck: true,
        knexInstance,
        migrationsBaseDirectory: path.join(
          process.cwd(),
          'prisma',
          'migrations',
        ),
      }),
    },
  };

  const knexClient = await Knex(config);
  await knexClient.migrate.latest();
}
