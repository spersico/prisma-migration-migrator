import path from 'node:path';
import dotenv from 'dotenv';

import { PrismaFolderShapedMigrationSource } from './src/migrationSource.mjs';
// If you seeing this to figure out how to use it, here you should replace this path with prisma-migration-migrator

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
