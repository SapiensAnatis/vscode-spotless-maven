import MavenExecutor, {
  MavenExecutionArgs,
  MavenExecutionResult,
} from './mavenExecutor';
import * as childProcess from 'child_process';
import Logger from '../logger';
import ConfigurationProvider from '../configurationProvider';
import * as fs from 'fs';
import * as fsPromises from 'fs/promises';
import { randomBytes } from 'crypto';

const TMP_DIR_NAME = '/tmp/vscode-spotless-maven';

class DaemonMavenExecutor implements MavenExecutor {
  private activeProcess: childProcess.ChildProcess | null = null;

  constructor(
    private configurationProvider: ConfigurationProvider,
    private logger: Logger
  ) {}

  public async runSpotlessApply({
    pomUri,
    documentUri,
    documentText,
    cancellationToken,
  }: MavenExecutionArgs): Promise<MavenExecutionResult> {
    const ac = new AbortController();
    cancellationToken.onCancellationRequested(() =>
      ac.abort('cancellationToken')
    );

    // mvnd doesn't support reading the stdin (yet) so we need to write to a
    // temporary file to pass in our document.
    //
    // TODO: if we absolutely *must* do this, we should write somewhere less obvious. Spotless does
    // not seem to want to format files in /tmp/ so maybe we could identify a suitable output dir like
    // target/
    const tempFilePath = documentUri.fsPath + '.tmp.java';
    await fsPromises.writeFile(tempFilePath, documentText, {
      signal: ac.signal,
      encoding: 'utf-8',
    });

    const args = [
      'spotless:apply',
      '-f',
      pomUri.fsPath,
      `-DspotlessIdeHook=${tempFilePath}`,
      // stdout also seems problematic for reasons that are less clear - NPE trying to create a logger
      // '-DspotlessIdeHookUseStdOut',
      '--quiet',
    ];

    try {
      const { stderr } = await this.runMaven(args, {
        signal: ac.signal,
      });

      const formattedDocumentText = await fsPromises.readFile(tempFilePath, {
        encoding: 'utf8',
      });

      return { formattedDocumentText, spotlessStatus: stderr };
    } finally {
      await fsPromises.unlink(tempFilePath);
    }
  }

  public dispose(): void {
    if (this.activeProcess && this.activeProcess.exitCode === null) {
      this.activeProcess.disconnect();
    }

    for (const file of fs.readdirSync(TMP_DIR_NAME)) {
      fs.unlinkSync(file);
    }
  }

  private async runMaven(
    args: string[],
    options: childProcess.ExecFileOptions
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const mvndCommand = this.configurationProvider.getMvndPath();

      if (!mvndCommand) {
        reject(
          'Could not find mvnd on the PATH. Set spotlessMaven.mvndPath to specify a custom path if needed.'
        );
        return;
      }

      this.logger.trace(`Executing maven daemon: ${mvndCommand}`, ...args);

      this.activeProcess = childProcess.execFile(
        mvndCommand,
        args,
        options,
        (error, stdout, stderr) => {
          if (error) {
            // mvnd always fails with an NPE creating a logger for some reason
            // this is absolutely evil but I wanted to get something working
            // TODO: STOP DOING THIS!!
            resolve({
              stdout: 'ignored as we read the file',
              stderr: 'IS DIRTY',
            });
            reject('mvnd execution failed. Check the logs for more details.');
          } else {
            this.logger.trace('Maven execution completed');
            resolve({ stdout, stderr });
          }
        }
      );

      this.activeProcess.stdout?.on('data', (data) => {
        this.logger.trace('stdout:', data);
      });
    });
  }
}

export default DaemonMavenExecutor;
