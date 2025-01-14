import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '..', '..', '..');

const prismaDir = path.join(baseDir, 'prisma');
const knexMigrationsDir = path.join(prismaDir, 'knex_migrations');
const prismaSchemaPath = path.resolve('prisma', 'schema.prisma');

const baseDBUrl = 'postgres://myuser:mypassword@localhost:5432';
const password = 'mypassword';
const testDbName = 'test_db';
const testDbUrl = `${baseDBUrl}/${testDbName}`;

const expectedInitialNumberOfMigrations = 2;

export {
  baseDir,
  prismaDir,
  knexMigrationsDir,
  prismaSchemaPath,
  baseDBUrl,
  password,
  testDbName,
  testDbUrl,
  expectedInitialNumberOfMigrations,
};
