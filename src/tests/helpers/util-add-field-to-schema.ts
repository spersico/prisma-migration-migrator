import { promises as fs } from 'fs';
import { prismaSchemaPath } from './constants.js';

export async function addFieldToPrismaSchema(fieldName: string = 'testField') {
  const schemaContent = await fs.readFile(prismaSchemaPath, 'utf-8');
  const updatedSchemaContent = schemaContent.replace(
    'model Article {',
    `model Article {\n  ${fieldName} String?`,
  );
  await fs.writeFile(prismaSchemaPath, updatedSchemaContent);
  console.log(
    `T > Added new field ("${fieldName}") to Prisma schema's Article model.`,
  );
}
