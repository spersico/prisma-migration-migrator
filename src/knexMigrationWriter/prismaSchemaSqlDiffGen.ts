import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function buildSqlFromPrismaSchema(
  schemaPath: string = './prisma/schema.prisma',
) {
  const script = `npx prisma migrate diff --from-schema-datasource ${schemaPath} --to-schema-datamodel ${schemaPath} --script`;
  const { stderr: prismaStderr, stdout: prismaStdout } =
    await execPromise(script);

  if (prismaStderr) {
    console.error('> Error fetching SQL from Prisma:', prismaStderr);
    return;
  }

  return prismaStdout;
}
