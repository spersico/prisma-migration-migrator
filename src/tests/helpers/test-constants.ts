import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseDir = path.resolve(__dirname, '..', '..', '..');

const prismaDir = path.join(baseDir, 'prisma');
const knexMigrationsDir = path.join(prismaDir, 'knex_migrations');

const baseDBUrl = 'postgres://myuser:mypassword@localhost:5432';
const password = 'mypassword';
const prismaDb = 'test_db_prisma';
const knexDb = 'test_db_knex';
const prismaDbUrl = `${baseDBUrl}/${prismaDb}`;
const knexTestDbUrl = `${baseDBUrl}/${knexDb}`;

export {
  prismaDir,
  knexMigrationsDir,
  baseDBUrl,
  password,
  prismaDb,
  knexDb,
  prismaDbUrl,
  knexTestDbUrl,
};
