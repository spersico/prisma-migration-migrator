#!/usr/bin/env node
import { setup } from './setup/index.mjs';
import { executeMigrationWorkflow } from './index.js';

function getFlags(argv): Record<string, string | boolean> {
  const filterArgs = (flag) => flag.includes('--');
  const mapFlags = (flag) => flag.split('--')[1].split('=');
  const args = argv.slice(2).filter(filterArgs).map(mapFlags);
  const flagsObj = {};

  for (const arg of args) {
    flagsObj[arg[0]] = arg[1] || true;
  }
  return flagsObj;
}

// Entry point for the CLI
async function main() {
  const flags: {
    setup?: boolean;
    'skip-check'?: boolean;
    'prisma-folder-path'?: string;
  } = getFlags(process.argv);

  if (flags.setup) {
    await setup();
  } else {
    const skipCheck = !!flags['skip-check'];
    const prismaFolderPath =
      flags['prisma-folder-path'] &&
      typeof flags['prisma-folder-path'] === 'string'
        ? flags['prisma-folder-path']
        : 'prisma';
    try {
      await executeMigrationWorkflow({ skipCheck, prismaFolderPath });
      process.exit(0);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  }
}

main();
