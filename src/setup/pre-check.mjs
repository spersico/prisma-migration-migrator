import { findKnexfile } from '../migrator/knexfileFinder.js';
import {
  prismaHasTheKnexModels,
  prismaSchemaExists,
} from './prismaSchemaUpdate.mjs';
import { getBaseDirectory } from '../migrator/directories.js';
import path from 'path';
import { errorLog, warningLog } from './textStyles.mjs';

async function checkKnexFileExistence(baseDir) {
  let knexfileExists = false;

  knexfileExists = await findKnexfile(baseDir);
  if (!knexfileExists) {
    warningLog(
      `No knexfile found in the project. I'll run the setup script to set up knex and prisma together`,
    );
    return true;
  }
  return false;
}

async function checkPrismaSchema(baseDir, prismaFolderPath = 'prisma') {
  const prismaSchemaPath = path.resolve(
    baseDir,
    prismaFolderPath,
    'schema.prisma',
  );
  const exists = await prismaSchemaExists(prismaSchemaPath);
  if (!exists) {
    errorLog(
      `Prisma schema not found at (${prismaSchemaPath}) - First set Prisma up, then run this script again`,
    );

    process.exit(1);
  }

  const prismaHasKnexModels = await prismaHasTheKnexModels(prismaSchemaPath);

  if (!prismaHasKnexModels) {
    warningLog(
      `Prisma schema found at (${prismaSchemaPath}), but it doesn't have the knex models. I'll run the setup script to add them`,
    );

    return true;
  }
  return false;
}

export async function checkIfSetupIsNeeded({ prismaFolderPath }) {
  const baseDir = getBaseDirectory();

  const knexFileExists = await checkKnexFileExistence(baseDir);
  const prismaSchemaIsReady = await checkPrismaSchema(
    baseDir,
    prismaFolderPath,
  );

  return knexFileExists || prismaSchemaIsReady;
}
