import { existsSync, rmSync } from 'node:fs';
import { readdir, rm, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

import {
  baseDBUrl,
  knexMigrationsDir,
  prismaDir,
  prismaSchemaPath,
  testDbName,
} from './constants.js';

function isTestProtectedFolder(entry: string) {
  const protectedFolders = [
    'init',
    'new_delete_field',
    'prisma',
    'migrations',
    'add_knex',
  ];

  return protectedFolders.some((folderName) => entry.includes(folderName));
}

async function resetDatabase(databaseName: string, silent = true) {
  const client = new pg.Client({ connectionString: baseDBUrl + '/postgres' });

  try {
    await client.connect();
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname='${databaseName}';`;
    const res = await client.query(checkDbQuery);

    if (res.rowCount > 0) {
      // Force disconnect all clients from the database
      await client.query(`SELECT pg_terminate_backend(pid) FROM pg_stat_activity
        WHERE datname = '${databaseName}' AND leader_pid IS NULL;`);

      // Drop the database if it exists
      await client.query(`DROP DATABASE ${databaseName}`);
      !silent && console.log(`Database ${databaseName} dropped successfully.`);
    }

    // Create the database
    await client.query(`CREATE DATABASE ${databaseName}`);
    !silent && console.log(`Database ${databaseName} reset successfully.`);
  } catch (error) {
    console.error(`Error resetting database ${databaseName}:`, error);
    throw error;
  } finally {
    await client.end();
  }
}
async function removeMigrationFiles(dir: string, silent = true) {
  if (!existsSync(dir))
    throw new Error(
      `RemoveMigrationFiles - Expected to exist directory (${dir}) does not exist .`,
    );

  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!isTestProtectedFolder(entry.name)) {
        await rm(fullPath, { recursive: true });
        !silent && console.log(`Removed folder: ${entry.name}`);
      } else {
        await removeMigrationFiles(fullPath);
      }
    } else if (entry.isFile() && entry.name === 'migration.mjs') {
      await unlink(fullPath);
      !silent && console.log(`Removed file: ${fullPath}`);
    }
  }
}

function cleanupMigrationFolder(dir: string, silent = true) {
  if (existsSync(dir)) {
    rmSync(dir, { recursive: true, force: true });
    !silent && console.log('Migrations directory removed.');
  }
}

async function resetPrismaSchemaFile(silent = true) {
  const schemaDesiredContent = `
  generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Article {
  id          Int      @id @default(autoincrement())
  title       String   @unique
  description String?
  body        String
  deleted     Boolean  @default(false)
  published   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime
}
  
model knex_migrations {
@@ignore
  id             Int       @id @default(autoincrement())
  name           String?   @db.VarChar(255)
  batch          Int?
  migration_time DateTime? @db.Timestamptz(6)
}

model knex_migrations_lock {
@@ignore
  index     Int  @id @default(autoincrement())
  is_locked Int?
}
`;

  await writeFile(prismaSchemaPath, schemaDesiredContent);
  !silent && console.log('Prisma schema reset successfully.');
}

// Cleanup function
export async function cleanup(colocate: boolean, silent = true) {
  if (colocate) {
    await removeMigrationFiles(prismaDir, silent);
  } else {
    cleanupMigrationFolder(knexMigrationsDir, silent);
  }

  await resetDatabase(testDbName);

  await resetPrismaSchemaFile(silent);
}
