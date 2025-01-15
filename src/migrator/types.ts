import type { IdentifyResult } from './types.js';

export type { IdentifyResult } from 'sql-query-identifier/lib/defines.js';

export type MigratorParameters = {
  prismaFolderPath?: string;
  knexfilePath?: string; // not strictly necessary, will try to find it. It's the fallback.
  knexMigrationsDir?: string; // not necessary, it's the fallback of the fallback

  silent?: boolean;
};

export type MigrationData = {
  name: string;
  baseSqlPath: string;
  finalMigrationPath: string;
  sql: IdentifyResult[];
  checksum: string;
};
