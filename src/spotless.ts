import * as vscode from 'vscode';
import * as path from 'path';
import MavenExecutor from './maven/mavenExecutor';
import CancellationTokenPromise from './cancellationTokenPromise';

const SPOTLESS_STATUS_IS_CLEAN = 'IS CLEAN';
const SPOTLESS_STATUS_DID_NOT_CONVERGE = 'DID NOT CONVERGE';
const SPOTLESS_STATUS_IS_DIRTY = 'IS DIRTY';

const SPOTLESS_STATUSES = [
  SPOTLESS_STATUS_DID_NOT_CONVERGE,
  SPOTLESS_STATUS_IS_CLEAN,
  SPOTLESS_STATUS_IS_DIRTY,
];

class Spotless {
  constructor(private readonly mavenExecutor: MavenExecutor) {}

  public async run(
    document: vscode.TextDocument,
    cancellationToken: vscode.CancellationToken
  ): Promise<string | null> {
    const cancellationPromise = new CancellationTokenPromise(cancellationToken);

    const basename = path.basename(document.uri.fsPath);
    const docPath = document.uri.fsPath;

    const args = [
      `-DspotlessIdeHook=${docPath}`,
      '-DspotlessIdeHookUseStdIn',
      '-DspotlessIdeHookUseStdOut',
      // '--no-configuration-cache',
      '--quiet',
    ];

    console.log(`Running spotless:apply on ${basename}`);

    const { stdout, stderr } = await this.mavenExecutor.runPluginGoal({
      documentLocation: document.uri,
      plugin: 'spotless',
      goal: 'apply',
      goalArgs: args,
      stdin: document.getText(),
      cancellationToken: cancellationToken,
    });

    if (cancellationToken.isCancellationRequested) {
      console.warn('Spotless formatting cancelled');
      return null;
    }

    const trimmedStdErr = stderr.trim();

    if (SPOTLESS_STATUSES.includes(trimmedStdErr)) {
      console.log(`${basename}: ${trimmedStdErr}`);
    }

    if (trimmedStdErr === SPOTLESS_STATUS_IS_DIRTY) {
      return stdout;
    } else if (trimmedStdErr === SPOTLESS_STATUS_IS_CLEAN) {
      return null;
    }

    throw new Error(trimmedStdErr || 'No status received from Spotless');
  }
}

export default Spotless;
