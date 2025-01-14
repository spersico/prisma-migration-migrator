import { setup } from './setup/index.mjs';

async function execute() {
  try {
    await setup();
    process.exit(0);
  } catch (error) {
    errorLog('Exception found during setup process - Exiting', error);
    process.exit(1);
  }
}

execute();
