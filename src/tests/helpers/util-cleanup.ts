import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';

import { readdir, rm, unlink } from 'node:fs/promises';
import {
  baseDBUrl,
  knexDb,
  knexMigrationsDir,
  prismaDb,
  prismaDir,
} from './test-constants.js';

const ProtectedFolders = [
  '20241112185404_init',
  '20241112190624_new_delete_field',
  'prisma',
  'migrations',
];

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
      if (!ProtectedFolders.includes(entry.name)) {
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

// Cleanup function
export async function cleanup(
  strategy: 'co-located' | 'standalone',
  silent = true,
) {
  if (strategy === 'co-located') {
    await removeMigrationFiles(prismaDir, silent);
  } else {
    cleanupMigrationFolder(knexMigrationsDir, silent);
  }

  await resetDatabase(prismaDb);
  await resetDatabase(knexDb);
}
