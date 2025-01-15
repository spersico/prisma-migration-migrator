import { fileURLToPath } from 'node:url';
import type { MigratorParameters } from './migrator/types.js';
import { migrator } from './migrator/index.js';
import { setup } from './setup/index.mjs';
import { checkIfSetupIsNeeded } from './setup/pre-check.mjs';

// Function to execute the migrator
async function executeMigrator() {
  const args = process.argv.slice(3);
  const prismaFolderPath = args[2] || 'prisma';

  try {
    if (!args.includes('--skip-check')) {
      await checkIfSetupIsNeeded({ prismaFolderPath });
    }

    await migrator({ prismaFolderPath });
    console.log(
      `Migrations converted successfully. Check the migrations directory.`,
    );
    process.exit(0);
  } catch (err) {
    console.error(
      `Error converting migrations. Check the error message below for more information.`,
    );
    console.error(err);
    process.exit(1);
  }
}

// Main function to handle command-line arguments
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--setup')) {
    await setup();
  } else {
    await executeMigrator();
  }
}

// If the script is run directly, execute the main function
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { migrator };
export type { MigratorParameters as ConvertPrismaMigrationsToKnexMigrationsParameters };
