import MavenExecutor, {
  MavenExecutionArgs,
  MavenExecutionResult,
} from './mavenExecutor';
import * as childProcess from 'child_process';
import Logger from '../logger';
import ConfigurationProvider from '../configurationProvider';

class BasicMavenExecutor implements MavenExecutor {
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

    const args = [
      'spotless:apply',
      `-DspotlessIdeHook=${documentUri.fsPath}`,
      '-DspotlessIdeHookUseStdIn',
      '-DspotlessIdeHookUseStdOut',
      '--quiet',
    ];

    const { stdout, stderr } = await this.runMaven(
      pomUri.fsPath,
      args,
      documentText,
      {
        signal: ac.signal,
      }
    );

    return { formattedDocumentText: stdout, spotlessStatus: stderr };
  }

  public dispose(): void {
    if (this.activeProcess && this.activeProcess.exitCode === null) {
      this.activeProcess.disconnect();
    }
  }

  private async runMaven(
    pomPath: string,
    args: string[],
    stdin: string,
    options: childProcess.ExecFileOptions
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      const mvnCommand = this.configurationProvider.getMvnPath();

      if (!mvnCommand) {
        reject(
          'Could not find mvn on the PATH. Set spotlessMaven.mvnPath to specify a custom path if needed.'
        );
        return;
      }

      const argsWithPom = ['-f', pomPath, ...args];

      this.logger.trace(`Executing maven: ${mvnCommand}`, ...argsWithPom);

      this.activeProcess = childProcess.execFile(
        mvnCommand,
        argsWithPom,
        options,
        (error, stdout, stderr) => {
          if (error) {
            this.logger.error(`Maven execution failed: ${stdout}`);
            reject('mvn execution failed. Check the logs for more details.');
          } else {
            this.logger.trace('Maven execution completed');
            resolve({ stdout, stderr });
          }
        }
      );

      this.activeProcess.stdout?.on('data', (data) => {
        this.logger.trace('stdout:', data);
      });

      if (!this.activeProcess.stdin) {
        reject(new Error('failed to get process stdin'));
      } else {
        this.activeProcess.stdin.write(stdin);
        this.activeProcess.stdin.end();
        this.logger.trace('Wrote document to Maven stdin');
      }
    });
  }
}

export default BasicMavenExecutor;
