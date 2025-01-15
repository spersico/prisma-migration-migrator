import {
  buildSqlFromPrismaSchema,
  knexMigrationWriter,
} from 'prisma-diff-to-knex-migration';

export async function prismaDiffToKnexMigration(params: {
  output: 'console' | 'file';
  migrationPath: string;
}) {
  try {
    console.log('> Fetching SQL from Prisma...');
    const sql = await buildSqlFromPrismaSchema();
    if (params.output === 'console') {
      console.log('> SQL fetched from Prisma:', sql);
    } else {
      await await knexMigrationWriter(sql, params.migrationPath);
      console.log(
        `> Updated migration file with Prisma's SQL:`,
        params.migrationPath,
      );
    }
  } catch (error) {
    console.error('> Error deploying migration:', error);
  }
}

/**
 * Executes the migration generation from the command line
 *
 * This intercepts the knex migration piped output and extracts the migration path,
 * then, it pulls the SQL diff from Prisma and writes it to the migration file as a starting point.
 *
 * Example usage: `npx knex migrate:make coso | npx `
 */
function executeFromCommandLine() {
  const args = process.argv.slice(2);

  let stdinData = '';
  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', (chunk) => {
    stdinData += chunk;
  });

  process.stdin.on('end', () => {
    // Extract the migration path from the stdin data
    const migrationPathMatch = stdinData.match(/Created Migration: (.+)/);

    if (!migrationPathMatch) {
      console.error('> Could not extract migration path from Knex output.');
      return;
    }

    const migrationPath = migrationPathMatch[1].trim();
    console.log('> Migration path:', migrationPath);

    const output = args.indexOf('--console-output') !== -1 ? 'console' : 'file';

    prismaDiffToKnexMigration({ output, migrationPath });
  });
}

executeFromCommandLine();
