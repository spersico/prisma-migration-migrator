import { knexFileGen } from './knexFileGen.mjs';
import { prismaSchemaUpdate } from './prismaSchemaUpdate.mjs';
import { packageJsonScriptUpdate } from './packageJsonScriptUpdate.mjs';
import {
  confirmationPrompt,
  successLog,
  textImportant,
  textTitle,
} from './textStyles.mjs';

export async function setup() {
  const continues = await confirmationPrompt(
    `${textTitle('Welcome to the Prisma-Migration-Migrator setup. This tool will help you set up Prisma and Knex together.')}  
      
${textImportant(`Note: This setup assumes you have already set up Prisma in your project. If you haven't, please do so before running this setup.
We will ask for confirmation on each step.`)}
Do you want to proceed?`,
    'Setup cancelled.',
  );
  if (!continues) return;

  await knexFileGen();

  await prismaSchemaUpdate();

  await packageJsonScriptUpdate();

  successLog('Setup completed successfully.');
}
