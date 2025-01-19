import { promises as fs } from 'fs';
import path from 'path';
import {
  confirmationPrompt,
  errorLog,
  successLog,
  textExtra,
  textTitle,
} from './textStyles.mjs';
import {
  packageJsonScriptUpdate,
  packageJsonShortcutScripts,
} from './packageJsonScriptUpdate.mjs';
import { getBaseDirectory } from '../migrator/directories.js';
import { fileURLToPath } from 'url';

/**
 * Adds a script to project, that syncs the migrations history between Prisma and Knex
 */
export async function syncMigrationsScript() {
  const { latest } = packageJsonShortcutScripts;
  const continues = await confirmationPrompt(
    `${textTitle('-------------------------\nSync Migrations Script Step\n---------------------------')}
Both Prisma and knex have their own way of tracking migrations, so that they don't run the same migrations twice.
Each has its own table to keep track of the migrations that have been applied.
Let's get Knex up to speed with what Prisma has done!
    
I will create a script (without running it) that will let you sync the two tables.
You will have to run it wherever you want to avoid knex running migrations that Prisma has already applied.
    
Running the script is a one-time operation, that ${textExtra(`NEEDS to happen on each environment where you run migrations.`)}
Otherwise, knex might run migrations that Prisma has already applied.

I will also add the following script to your package.json, so that you can run it easily before migrating with knex:
${textExtra(latest.name)}: ${textExtra(latest.script)}
I won't run it for you, so you can run it whenever you want.

Do you want to proceed?`,
    `The script won't be added. You can add it later by running this script plus the -- --setup flag.`,
  );

  if (!continues) return;

  try {
    const baseDir = getBaseDirectory();
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const sourceFilePath = path.resolve(
      __dirname,
      'syncKnexPrismaMigrationsHistoryTemplate.mjs',
    );
    const targetFilePath = path.resolve(
      baseDir,
      'sync-knex-prisma-migrations-history.mjs',
    );

    const sourceContent = await fs.readFile(sourceFilePath, 'utf-8');

    await fs.writeFile(targetFilePath, sourceContent);
    successLog(`Script file added to ${targetFilePath} successfully.`);
  } catch (error) {
    errorLog('Error creating script:', error);
    process.exit(1);
  }

  try {
    console.log('Adding script to package.json...');
    await packageJsonScriptUpdate(latest);
    successLog(`Script "${latest.name}" added to package.json successfully.`);
  } catch (error) {
    errorLog('Error updating package.json:', error);
    process.exit(1);
  }
}
