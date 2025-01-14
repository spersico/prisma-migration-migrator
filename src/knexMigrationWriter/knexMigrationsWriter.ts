import { identify } from 'sql-query-identifier';
import type { IdentifyResult } from 'sql-query-identifier/lib/defines.js';
import { writeFile } from 'node:fs/promises';

const knexMigrationBaseContent = `/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  // Add your up migration SQL here
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  // Add your down migration SQL here
}
` as const;

export function generateKnexMigration(rawSql: string = ''): string {
  const parsedSQL: IdentifyResult[] = identify(rawSql);
  if (!parsedSQL.length) return knexMigrationBaseContent;

  const sentences = parsedSQL
    .map(
      (parsed) => `await knex.raw(\`
${parsed.text.replace(/`/g, '\\`')}
\`);`,
    )
    .join('\n\n  ');

  return knexMigrationBaseContent.replace(
    '// Add your up migration SQL here',
    sentences,
  );
}

/**
 * Identifies the SQL queries and writes the knex migration file, in the final migration path
 * @param {MigrationData} prismaMigration - The migration data
 */
export async function knexMigrationWriter(
  prismaGeneratedSql: string,
  filePath: string,
): Promise<string> {
  const knexMigration = generateKnexMigration(prismaGeneratedSql);
  await writeFile(filePath, knexMigration);
  return knexMigration;
}
