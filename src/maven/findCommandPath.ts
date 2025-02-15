import * as childProcess from 'child_process';

function findCommandPathUnix(commandName: 'mvn' | 'mvnd'): string | null {
  try {
    return childProcess
      .execSync(`command -v ${commandName}`, {
        encoding: 'utf-8',
      })
      .trimEnd();
  } catch (e) {
    return null;
  }
}

function findCommandPathWindows(commandName: 'mvn' | 'mvnd'): string | null {
  try {
    return childProcess.execSync(`where.exe ${commandName}`, {
      encoding: 'utf-8',
    });
  } catch (e) {
    return null;
  }
}

/**
 * Finds the real path to the mvn / mvnd binary.
 *
 * Because we are using Node's execFile API to avoid spawning a shell every time,
 * we need to know the precise path of the mvn binary and can't rely on it
 * being on the PATH, particularly if a user has added the folder to their PATH
 * using .bashrc or similar.
 *
 * @param configurationProvider Instance of @see ConfigurationProvider.
 * @returns The path of the mvn / mvnd binary, or null if it was not found on the PATH.
 */
function findCommandPath(commandName: 'mvn' | 'mvnd'): string | null {
  if (!(commandName === 'mvn' || commandName === 'mvnd')) {
    // Prevent potential shell injection
    throw new Error('Illegal commandName value');
  }

  if (process.platform === 'linux' || process.platform === 'darwin') {
    return findCommandPathUnix(commandName);
  } else if (process.platform === 'win32') {
    return findCommandPathWindows(commandName);
  } else {
    // VSCode should not be able to run on any other OS like BSD
    throw new Error(`Unsupported operating system: ${process.platform}`);
  }
}

export default findCommandPath;
