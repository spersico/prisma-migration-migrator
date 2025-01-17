#!/usr/bin/env node

import { fileURLToPath } from 'node:url';
import type { MigratorParameters } from './migrator/types.js';
import { migrator } from './migrator/index.js';
import { setup } from './setup/index.mjs';
import { checkIfSetupIsNeeded } from './setup/pre-check.mjs';
import { errorLog, successLog, warningLog } from './setup/textStyles.mjs';

// Function to execute the migrator
async function executeMigrator({
  skipCheck,
  prismaFolderPath,
}: {
  skipCheck: boolean;
  prismaFolderPath: string;
}): Promise<void> {
  try {
    if (!skipCheck) {
      console.log(
        '> No --skip-check flag detected. Checking if setup is needed for knex to run alongside prisma...',
      );
      const setupNeeded = await checkIfSetupIsNeeded({ prismaFolderPath });
      if (setupNeeded) {
        warningLog(
          `> Setup is needed. Running setup for knex to run alongside prisma...`,
        );
        await setup();
        successLog(
          '> Setup completed. Continuing with the migration conversion process...',
        );
      } else {
        successLog(
          '> Setup is not needed. Continuing with the migration conversion process...',
        );
      }
    }

    await migrator({ prismaFolderPath });
    successLog(
      `Migrations converted successfully. Check the migrations directory.`,
    );
    process.exit(0);
  } catch (err) {
    errorLog(
      `Error converting migrations. Check the error message below for more information.`,
    );
    console.error(err);
    process.exit(1);
  }
}

function getFlags(argv): Record<string, string | boolean> {
  const filterArgs = (flag) => flag.includes('--');
  const mapFlags = (flag) => flag.split('--')[1].split('=');
  const args = argv.slice(2).filter(filterArgs).map(mapFlags);
  const flagsObj = {};

  for (const arg of args) {
    flagsObj[arg[0]] = arg[1] || true;
  }
  return flagsObj;
}

// Main function to handle command-line arguments
async function main() {
  const flags: {
    setup?: boolean;
    'skip-check'?: boolean;
    'prisma-folder-path'?: string;
  } = getFlags(process.argv);

  if (flags.setup) {
    await setup();
  } else {
    const skipCheck = !!flags['skip-check'];
    const prismaFolderPath =
      flags['prisma-folder-path'] &&
      typeof flags['prisma-folder-path'] === 'string'
        ? flags['prisma-folder-path']
        : 'prisma';

    await executeMigrator({ skipCheck, prismaFolderPath });
  }
}

// If the script is run directly, execute the main function
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { migrator };
export type { MigratorParameters as ConvertPrismaMigrationsToKnexMigrationsParameters };
