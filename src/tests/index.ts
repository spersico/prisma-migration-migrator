import base from './cases/base.js';
import { knexTestDbUrl, prismaDbUrl } from './helpers/test-constants.js';
import type { TestParameters } from './types.js';

const cases: TestParameters[] = [
  {
    dbUrl: prismaDbUrl,
    altDbUrl: knexTestDbUrl, // uses different DBs, to test if they both produce the same migrations. Expect a warning
    strategy: 'co-located',
  },
  {
    dbUrl: prismaDbUrl, // Uses the same DB, to test if moving from prisma to knex is seamless
    strategy: 'co-located',
  },
  {
    dbUrl: prismaDbUrl,
    strategy: 'standalone', // Alternative strategy of where to set the knex migrations
  },
];

async function executeAllTests() {
  try {
    for await (const parameters of cases) {
      console.group('Running test with parameters', parameters);
      await base({ ...parameters, silent: false });
      console.groupEnd();
      console.log(`\x1b[32mTest pass\x1b[0m`);
    }
    console.log(`\x1b[32mAll tests passed\x1b[0m`);
    process.exit(0);
  } catch (error) {
    console.error(`\x1b[31mError running tests\x1b[0m`, error);
    process.exit(1);
  }
}

executeAllTests();
