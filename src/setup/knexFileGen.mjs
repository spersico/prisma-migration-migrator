import { promises as fs } from 'node:fs';
import inquirer from 'inquirer';
import {
  confirmationPrompt,
  successLog,
  textExtra,
  textItalic,
  textTitle,
  textWarning,
} from './textStyles.mjs';

const standaloneTemplate = `
// Knex configuration object
const config = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    extension: 'mjs',
    loadExtensions: ['.mjs'],
    directory: 'prisma/knex_migrations',
  },
};

export default config;
`;

const coLocatedKnexfileTemplate = `
import { knexFilePrismaAdapter } from 'prisma-migration-migrator';

// Knex configuration object
const config = knexFilePrismaAdapter({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: 'prisma/migrations',
  },
});

export default config;
`;

const dotenvTemplate = `
import dotenv from 'dotenv';
dotenv.config();
`;

function buildKnexfileContent(addDotenv = true, colocated = false) {
  let knexfileContent = colocated
    ? coLocatedKnexfileTemplate
    : standaloneTemplate;

  if (addDotenv)
    return knexfileContent.replace(
      '// Knex configuration object',
      '// Knex configuration object\n' + dotenvTemplate,
    );

  return knexfileContent;
}

export async function knexFileGen() {
  const continues = await confirmationPrompt(
    `${textTitle('-------------------------\nKnexfile creation step\n---------------------------')}
This step will create a ${textExtra('knexfile.mjs')} file on the base directory.    

${textExtra(`Note: We use mjs because knex's support of it is more reliable than with Typescript. 
  Using mjs gives us modern JS, without being problematic to use.`)}

If you've already created a knexfile.mjs file, this step will overwrite it. Do you wish to proceed?`,
    'Knexfile creation step skipped.',
  );
  if (!continues) return;

  const { dotenv, colocated } = await inquirer.prompt([
    {
      type: 'list',
      name: 'dotenv',
      message: `Do you wish for the knexfile.mjs to use the ${textItalic('dotenv')} library for environment variables?
${textWarning(`If you don't want to add it, it's fine, as long as you set the connection property correctly.`)}`,
      choices: ['Yes', 'No'],
    },
    {
      type: 'list',
      name: 'colocated',
      message: `Do you wish for the migrations to be co-located with the Prisma migrations?`,
      choices: ['No', 'Yes'],
    },
  ]);

  await fs.writeFile(
    'knexfile.mjs',
    buildKnexfileContent(dotenv === 'Yes', colocated === 'Yes'),
  );
  successLog(
    '> knexfile.mjs created successfully on base directory. Please review it.',
  );
}
