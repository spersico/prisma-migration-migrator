import { exec } from 'node:child_process';
import util from 'util';
import path from 'node:path';
import pg from 'pg';
import { password, baseDir } from './constants.js';
import { writeFile } from 'node:fs/promises';

const execPromise = util.promisify(exec);

// Snapshot DB structure
export async function snapshotDbStructure(
  dbUrl: string,
  silent: boolean = true,
): Promise<string> {
  const client = new pg.Client({ connectionString: dbUrl });

  try {
    const dumpCommand = `PGPASSWORD=${password} pg_dump -U ${client.user} -h ${client.host} -d ${client.database} --table='public."Article"' --schema-only -s`;
    const { stdout, stderr } = await execPromise(dumpCommand);

    if (stderr) {
      throw new Error(stderr);
    }

    if (!silent) {
      const outputFilePath = path.join(
        baseDir,
        `TEST_DDL_${client.database}.sql`,
      );

      await writeFile(
        outputFilePath,
        'OUTPUT:\n' + stdout + (stderr ? '\nERROR' + stderr : ''),
      );

      console.log(`Database (${client.database}) dump written to file`, {
        stdout,
        stderr,
      });
    }

    return stdout;
  } catch (error) {
    console.error(`Error snapshotting DB structure ${client.database}:`, error);
    throw error;
  } finally {
    await client.end();
  }
}
