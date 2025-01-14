import { readdir } from 'node:fs/promises';
import path from 'node:path';

/***
 * Find a knexfile-like in the project directory
 */
export async function findKnexfile(
  baseDir: string = './',
): Promise<string | null> {
  const files = await readdir(baseDir);
  const knexfile = files.find(
    (file) =>
      file.startsWith('knexfile') &&
      (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.mjs')),
  );
  return knexfile ? path.join(baseDir, knexfile) : null;
}
