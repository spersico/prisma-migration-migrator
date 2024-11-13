import path from 'node:path';
import dotenv from 'dotenv';
import { PrismaFolderShapedMigrationSource } from './src/migrationSource.mjs';
import Knex from 'knex';
dotenv.config();

const baseConfig = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
};

const knexInstance = Knex(baseConfig);

const config = {
  development: {
    ...baseConfig,
    migrations: {
      migrationSource: new PrismaFolderShapedMigrationSource({
        knexInstance,
        migrationsBaseDirectory: path.join(
          process.cwd(),
          'prisma',
          'migrations',
        ),
      }),
    },
  },
};

export default config;
