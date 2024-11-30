import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';

import { readdir, rmdir, unlink } from 'node:fs/promises';
import { baseDBUrl, knexDb, prismaDb, prismaDir } from './test-constants.js';

const ProtectedFolders = [
  '20241112185404_init',
  '20241112190624_new_delete_field',
  'prisma',
  'migrations',
];

async function resetDatabase(databaseName: string) {
  const client = new pg.Client({ connectionString: baseDBUrl + '/postgres' });

  try {
    await client.connect();
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname='${databaseName}'`;
    const res = await client.query(checkDbQuery);

    if (res.rowCount > 0) {
      // Drop the database if it exists
      await client.query(`DROP DATABASE ${databaseName}`);
      console.log(`Database ${databaseName} dropped successfully.`);
    }

    // Create the database
    await client.query(`CREATE DATABASE ${databaseName}`);
    console.log(`Database ${databaseName} reset successfully.`);
  } catch (error) {
    console.error(`Error resetting database ${databaseName}:`, error);
    throw error;
  } finally {
    await client.end();
  }
}
async function removeMigrationFiles(dir: string) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!ProtectedFolders.includes(entry.name)) {
        await rmdir(fullPath, { recursive: true });
        console.log(`Removed folder: ${entry.name}`);
      } else {
        await removeMigrationFiles(fullPath);
      }
    } else if (entry.isFile() && entry.name === 'migration.mjs') {
      await unlink(fullPath);
      console.log(`Removed file: ${fullPath}`);
    }
  }
}

function cleanupMigrationFiles() {
  if (existsSync(prismaDir)) {
    rmSync(prismaDir, { recursive: true, force: true });
    console.log('Knex migrations directory cleaned up.');
  }
}

// Cleanup function
export async function cleanup(strategy: string = 'co-located') {
  if (strategy === 'co-located') {
    await removeMigrationFiles(prismaDir);
  } else {
    cleanupMigrationFiles();
  }

  await resetDatabase(prismaDb);
  await resetDatabase(knexDb);
}
