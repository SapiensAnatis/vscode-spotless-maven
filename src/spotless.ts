import * as vscode from 'vscode';
import * as path from 'path';
import MavenExecutor from './maven/mavenExecutor';
import CancellationTokenPromise from './cancellationTokenPromise';
import Logger from './logger';
import getPomPath from './maven/getPomPath';

const SPOTLESS_STATUS_IS_CLEAN = 'IS CLEAN';
const SPOTLESS_STATUS_DID_NOT_CONVERGE = 'DID NOT CONVERGE';
const SPOTLESS_STATUS_IS_DIRTY = 'IS DIRTY';

const SPOTLESS_STATUSES = [
  SPOTLESS_STATUS_DID_NOT_CONVERGE,
  SPOTLESS_STATUS_IS_CLEAN,
  SPOTLESS_STATUS_IS_DIRTY,
];

class Spotless implements vscode.Disposable {
  constructor(
    private readonly mavenExecutor: MavenExecutor,
    private readonly logger: Logger
  ) {}

  public async run(
    document: vscode.TextDocument,
    cancellationToken: vscode.CancellationToken
  ): Promise<string | null> {
    const basename = path.basename(document.uri.fsPath);

    this.logger.info(`Running spotless:apply on ${basename}`);

    // TODO multi-POM support: take account of nearest pom to document
    const pomUri = await getPomPath();

    if (!pomUri) {
      this.logger.error('No Maven project found.');
      throw new Error('No Maven project found.');
    }

    this.logger.info(`Using maven project: ${pomUri}`);

    const { formattedDocumentText, spotlessStatus } =
      await this.mavenExecutor.runSpotlessApply({
        pomUri,
        documentUri: document.uri,
        documentText: document.getText(),
        cancellationToken: cancellationToken,
      });

    console.log({ formattedDocumentText, spotlessStatus });

    if (cancellationToken.isCancellationRequested) {
      this.logger.warning('Spotless formatting cancelled');
      return null;
    }

    const trimmedStdErr = spotlessStatus.trim();

    if (SPOTLESS_STATUSES.includes(trimmedStdErr)) {
      this.logger.debug(`${basename}: ${trimmedStdErr}`);
    }

    if (trimmedStdErr === SPOTLESS_STATUS_IS_DIRTY) {
      return formattedDocumentText;
    } else if (trimmedStdErr === SPOTLESS_STATUS_IS_CLEAN) {
      return null;
    }

    throw new Error(trimmedStdErr || 'No status received from Spotless');
  }

  public dispose(): void {
    this.mavenExecutor.dispose();
  }
}

export default Spotless;
