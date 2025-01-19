import { promises as fs } from 'node:fs';
import { existsSync } from 'node:fs';
import inquirer from 'inquirer';

import path from 'path';
import {
  confirmationPrompt,
  errorLog,
  successLog,
  textImportant,
  textTitle,
} from './textStyles.mjs';
const prismaSchemaFile_knexModels = `

model knex_migrations {
  @@ignore
  id             Int       @id @default(autoincrement())
  name           String?
  batch          Int?
  migration_time DateTime?
}

model knex_migrations_lock {
  @@ignore
  index     Int  @id @default(autoincrement())
  is_locked Int?
}
`;

export async function prismaSchemaExists(schemaPath) {
  const resolvedSchemaPath = path.resolve(schemaPath);
  return existsSync(resolvedSchemaPath);
}

export async function prismaHasTheKnexModels(schemaPath) {
  const resolvedSchemaPath = path.resolve(schemaPath);
  const schemaContent = await fs.readFile(resolvedSchemaPath, 'utf-8');
  return (
    schemaContent.includes('model knex_migrations') &&
    schemaContent.includes('model knex_migrations_lock')
  );
}

export async function prismaSchemaUpdate() {
  const continues = await confirmationPrompt(
    `${textTitle('-------------------------\nPrisma Schema update step\n---------------------------')}
Moving forward, we can use Prisma to build the SQL needed for migrations, based on the difference between the Prisma schema and the database.
For that, we need to indicate Prisma that it needs to ignore the knex tables in the database.

${textImportant(`This step will append the models to your Prisma schema file. If we don't do this, Prisma will try to create these tables in the database.`)}
Do you wish to proceed?`,
    `The prisma schema won't be updated. In case you need it, here's the content to add:\n${prismaSchemaFile_knexModels}`,
  );
  if (!continues) return;

  const { schema } = await inquirer.prompt([
    {
      type: 'input',
      name: 'schema',
      message:
        'Do you have a custom path for your Prisma schema file? (press ENTER otherwise, to just use the default "prisma/schema.prisma"):',
      default: 'prisma/schema.prisma',
    },
  ]);

  const resolvedSchemaPath = path.resolve(schema);

  const schemaExists = await prismaSchemaExists(schema);
  if (!schemaExists) {
    errorLog(
      `> Prisma schema not found at ${resolvedSchemaPath}. Skipping this step`,
    );
    return;
  }

  const prismaSchemaHasKnexModels = await prismaHasTheKnexModels(schema);
  if (prismaSchemaHasKnexModels) {
    successLog(
      '> Prisma schema already has the required models. Skipping this step',
    );
    return;
  }

  await fs.appendFile(resolvedSchemaPath, prismaSchemaFile_knexModels);
  successLog(
    `> Knex models appended to Prisma schema at ${resolvedSchemaPath}`,
  );
}
