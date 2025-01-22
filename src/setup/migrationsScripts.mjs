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
export async function migrationsScripts() {
  const { sync, generate, apply } = packageJsonShortcutScripts;

  const continues = await confirmationPrompt(
    `${textTitle('-------------------------\nSync Migrations Script Step\n---------------------------')}
Both Prisma and knex have their own way of tracking migrations, so that they don't run the same migrations twice.
Each has its own table to keep track of the migrations that have been applied.
    
I created a script file on the base folder of your project (without running it) that will let you sync the two tables.
YOU will have to run it wherever you want to avoid knex running migrations that Prisma has already applied.

I made it easy to read and understand, so you can modify it if you need to.

You should only need to run the script ONCE ${textExtra(`per environment where you run migrations with Prisma previously`)}.
Otherwise, knex will run migrations that Prisma applied previously.


On top of that, I will add 3 scripts to your package.json to handle migrations with Prisma and Knex together:
1) ${textExtra(sync.name)}: ${textExtra(sync.script)}
2) ${textExtra(generate.name)}: ${textExtra(generate.script)}
3) ${textExtra(apply.name)}: ${textExtra(apply.script)}

The scripts will work as follows:
1) Syncs the migrations history between Prisma and Knex.
2) Generates a migration with Knex and then generates the SQL for that migration with Prisma.
3) Applies the migrations with Knex (syncing first with (1)), and then refreshing the Prisma client.

Press ENTER to proceed`,
    `The scripts won't be added to package.json.`,
  );

  try {
    console.log('Adding sync script file to the project... (un-skipable)');
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

  if (!continues) return;

  try {
    console.log('Adding script to package.json...');
    await packageJsonScriptUpdate(sync);
    await packageJsonScriptUpdate(generate);
    await packageJsonScriptUpdate(apply);
    successLog(`Scripts added to package.json successfully.`);
  } catch (error) {
    errorLog('Error updating package.json:', error);
    process.exit(1);
  }
}
