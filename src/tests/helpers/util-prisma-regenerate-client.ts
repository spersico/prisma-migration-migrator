import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

const successMessage = '✔ Generated Prisma Client';
export async function runPrismaClientReGenerate() {
  const { stderr, stdout } = await execPromise('npx prisma generate');
  if (stderr || !stdout.includes(successMessage)) {
    console.error('T > Error running Prisma Client generate:', stdout, stderr);
    throw new Error(stderr);
  }
  console.log('T > Prisma migration generated successfully');
}
