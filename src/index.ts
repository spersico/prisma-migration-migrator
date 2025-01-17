import type { MigratorParameters } from './migrator/types.js';
import { migrator } from './migrator/index.js';
import { setup } from './setup/index.mjs';
import { checkIfSetupIsNeeded } from './setup/pre-check.mjs';
import { errorLog, successLog, warningLog } from './setup/textStyles.mjs';

export async function executeMigrationWorkflow({
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
  } catch (err) {
    errorLog(`Error converting migrations`);
    throw err;
  }
}

export type { MigratorParameters };
export { migrator };
