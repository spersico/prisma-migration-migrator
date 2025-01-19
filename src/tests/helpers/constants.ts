import path from 'node:path';
import { getBaseDirectory } from '../../migrator/directories.js';

const prismaSchemaPath = path.resolve('prisma', 'schema.prisma');
const knexMigrationsDir = path.join(
  getBaseDirectory(),
  'prisma',
  'knex_migrations',
);

const baseDBUrl = 'postgres://myuser:mypassword@localhost:5432';
const password = 'mypassword';
const testDbName = 'test_db';
const testDbUrl = `${baseDBUrl}/${testDbName}`;

const expectedInitialNumberOfMigrations = 2;

export {
  knexMigrationsDir,
  prismaSchemaPath,
  baseDBUrl,
  password,
  testDbName,
  testDbUrl,
  expectedInitialNumberOfMigrations,
};
