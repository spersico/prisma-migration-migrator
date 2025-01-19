import { promises as fs } from 'fs';
import path from 'path';
import { successLog, warningLog } from './textStyles.mjs';

export const packageJsonShortcutScripts = {
  generate: {
    name: 'migration:generate',
    script:
      'npx knex migrate:make migration | npx prisma-diff-to-knex-migration',
  },
  latest: {
    name: 'migration:latest',
    script:
      'npx ./sync-knex-prisma-migrations-history && npx knex migrate:latest',
  },
};

export async function packageJsonScriptUpdate({
  name,
  script,
  ignoreIfExists,
}) {
  const packageJsonPath = path.resolve('package.json');
  const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(packageJsonContent);

  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  if (ignoreIfExists && packageJson.scripts[name]) {
    warningLog(`Script "${name}" already exists in package.json. Skipping`);
    return;
  }

  packageJson.scripts[name] = script;

  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  successLog(`Script "${name}" added to package.json successfully.`);
}
