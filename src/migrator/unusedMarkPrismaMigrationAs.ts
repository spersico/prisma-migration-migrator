import { exec } from 'node:child_process';
import util from 'util';

const execPromise = util.promisify(exec);

/**
 * @typedef {Object} MarkPrismaMigrationAsParams
 * @property {string} [databaseUrl]
 * @property {string} migrationName
 * @property {'applied' | 'rolled-back'} action
 * @property {string} [schema]
 */

/**
 * Marks a Prisma migration as applied or rolled-back.
 * @param {MarkPrismaMigrationAsParams} params - The parameters for marking the migration.
 */
export async function markPrismaMigrationAs({
  databaseUrl,
  migrationName,
  action,
  schema,
}) {
  if (!migrationName) throw new Error('You must provide a migration name');
  const env = { ...process.env };
  let commandToRun = 'npx prisma migrate resolve';
  if (databaseUrl) env.DATABASE_URL = databaseUrl;
  commandToRun += ` --${action} ${migrationName}`;
  if (schema) commandToRun += ` --schema=${schema}`;

  const { stdout, stderr } = await execPromise(commandToRun, { env });
  console.log(` > markPrismaMigrationAs ${action} ${migrationName}: `, stdout);

  if (stderr) {
    throw new Error(stderr);
  }
}

// Example usage:
// await markPrismaMigrationAs({
//   action: 'applied',
//   migrationName: '20250112145436_add_knex_models',
// });
