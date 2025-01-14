import { knexMigrationWriter } from '../knexMigrationWriter/knexMigrationsWriter.js';
import type { MigrationData } from './types.js';

export async function knexMigrationsWriter(
  migrations: MigrationData[],
): Promise<void> {
  if (!migrations.length) {
    console.log('> No migrations to convert - Skipping conversion');
    return;
  }

  try {
    const converted = await Promise.all(
      migrations.map(({ sql, finalMigrationPath }) =>
        knexMigrationWriter(sql, finalMigrationPath),
      ),
    );
    console.log(
      `> Successfully converted ${converted.length} Prisma migrations to Knex migrations`,
    );
  } catch (err) {
    console.error('> Error converting migration', { migrations }, err);
    throw err;
  }
}
