import {
  packageJsonShortcutScripts,
  packageJsonScriptUpdate,
} from './packageJsonScriptUpdate.mjs';
import {
  confirmationPrompt,
  errorLog,
  textExtra,
  textTitle,
} from './textStyles.mjs';

export async function packageJsonScriptGenerate() {
  const { generate } = packageJsonShortcutScripts;
  const continues = await confirmationPrompt(
    `${textTitle('-------------------------\nPackage JSON - Migration Generation script\n---------------------------')}
Lastly, we should add a script to your package.json to generate migrations with Prisma and Knex together:

${textExtra(generate.name)}: ${textExtra(generate.script)}

This will first generate a normal migration with Knex, and then use Prisma generate the SQL it would normally generate for that migration.
The SQL from Prisma is based on the difference between the Prisma schema and the database.`,
    `The package script won't be added`,
  );

  if (!continues) return;

  try {
    await packageJsonScriptUpdate({
      ...generate,
      ignoreIfExists: true,
    });
  } catch (error) {
    errorLog('Error updating package.json:', error);
    process.exit(1);
  }
}
