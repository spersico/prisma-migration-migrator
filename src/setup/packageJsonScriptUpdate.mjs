import { promises as fs } from 'fs';
import path from 'path';
import {
  confirmationPrompt,
  errorLog,
  successLog,
  textExtra,
  textTitle,
  warningLog,
} from './textStyles.mjs';

export const packageJsonScriptUpdateContent = {
  name: 'migration:generate',
  script: 'npx knex migrate:make $1 | npx prisma-diff-to-knex',
};

const { name, script } = packageJsonScriptUpdateContent;

/**
 * Adds a script to the scripts object in package.json.
 */
export async function packageJsonScriptUpdate() {
  const continues = await confirmationPrompt(
    `${textTitle('-------------------------\nPackage Script shortcut step\n---------------------------')}
Lastly, we can add a script to your package.json to generate migrations with Prisma and Knex together.
The way it works, is that it generates a migration with Knex, and then uses Prisma to add the SQL needed for that migration.
The SQL from Prisma is based on the difference between the Prisma schema and the database.

Do you want to add a package.json script named ${textExtra(name)}?. 
The script is the following: ${textExtra(script)}`,
    `The package script won't be added`,
  );

  if (!continues) return;

  try {
    const packageJsonPath = path.resolve('package.json');
    const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    if (packageJson.scripts[name]) {
      warningLog(
        `Script "${name}" already exists in package.json. Skipping this step.`,
      );
      return;
    }

    packageJson.scripts[name] = script;

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    successLog(`Script "${name}" added to package.json successfully.`);
  } catch (error) {
    errorLog('Error updating package.json:', error);
    process.exit(1);
  }
}
