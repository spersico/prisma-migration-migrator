import chalk from 'chalk';
import inquirer from 'inquirer';

export const textTitle = chalk.bold.blue;
export const textError = chalk.bold.red;
export const textWarning = chalk.bold.yellow;
export const textSuccess = chalk.bold.green;
export const textImportant = chalk.bold;
export const textItalic = chalk.italic;
export const textExtra = chalk.italic.cyan;

export const successLog = (message, ...args) =>
  console.log(textSuccess(message), ...args);
export const errorLog = (message, ...args) =>
  console.log(textError(message), ...args);
export const warningLog = (message, ...args) =>
  console.log(textWarning(message), ...args);

export async function confirmationPrompt(message, exitMessage) {
  try {
    const { confirm } = await inquirer.prompt([
      {
        type: 'list',
        name: 'confirm',
        message: message,
        choices: ['Yes', 'No'],
      },
    ]);
    if (confirm === 'No') {
      warningLog(exitMessage);
      return false;
    }
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      errorLog('Setup interrupted by user');
      process.exit(1);
    } else {
      throw error;
    }
  }
}
