import { findKnexfile } from '../migrator/knexfileFinder.js';
import {
  prismaHasTheKnexModels,
  prismaSchemaExists,
} from './prismaSchemaUpdate.mjs';
import { getBaseDirectory } from '../migrator/directories.js';
import path from 'path';

async function checkKnexFileExistence(baseDir) {
  let knexfileExists = false;

  knexfileExists = await findKnexfile(baseDir);
  if (!knexfileExists) {
    console.log(
      `No knexfile found in the project. You'll want to run the setup script to set up knex and prisma together`,
    );
    process.exit(1);
  }
}

async function checkPrismaSchema(baseDir, prismaFolderPath = 'prisma') {
  const prismaSchemaPath = path.resolve(
    baseDir,
    prismaFolderPath,
    'schema.prisma',
  );
  const exists = await prismaSchemaExists(prismaSchemaPath);
  if (!exists) {
    console.log(
      `Prisma schema not found at (${prismaSchemaPath}) - First set Prisma up, then run the setup script`,
    );
    process.exit(1);
  }

  const prismaHasKnexModels = await prismaHasTheKnexModels(prismaSchemaPath);

  if (!prismaHasKnexModels) {
    console.log(
      `Prisma schema found at (${prismaSchemaPath}), but it doesn't have the knex models. Run the setup script to add them`,
    );
    process.exit(1);
  }
}

export async function checkIfSetupIsNeeded({ prismaFolderPath }) {
  const baseDir = getBaseDirectory();
  await checkKnexFileExistence(baseDir);
  await checkPrismaSchema(baseDir, prismaFolderPath);
}
