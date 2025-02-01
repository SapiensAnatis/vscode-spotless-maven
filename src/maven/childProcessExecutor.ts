import * as vscode from 'vscode';
import MavenExecutor, {
  MavenExecutionArgs,
  MavenExecutionResult,
} from './mavenExecutor';
import getPomPath from './getPomPath';
import * as childProcess from 'child_process';
import Logger from '../logger';
import ConfigurationProvider from '../configurationProvider';

class ChildProcessExecutor implements MavenExecutor {
  private activeProcess: childProcess.ChildProcess | null = null;

  constructor(
    private configurationProvider: ConfigurationProvider,
    private logger: Logger
  ) {}

  public async runPluginGoal({
    documentLocation,
    plugin,
    goal,
    goalArgs,
    stdin,
    cancellationToken,
  }: MavenExecutionArgs): Promise<MavenExecutionResult> {
    // TODO multi-POM support: take account of nearest pom to document
    const pomUri = await getPomPath();

    if (!pomUri) {
      this.logger.error('No Maven project found.');
      throw new Error('No Maven project found.');
    }

    this.logger.info(`Using maven project: ${pomUri}`);

    const ac = new AbortController();
    cancellationToken.onCancellationRequested(() =>
      ac.abort('cancellationToken')
    );

    const args = [`${plugin}:${goal}`, ...goalArgs];
    return await this.runMaven(pomUri.fsPath, args, stdin, {
      signal: ac.signal,
    });
  }

  public dispose(): void {
    // Unsure if this is correct
    if (this.activeProcess && this.activeProcess.exitCode === null) {
      this.activeProcess.disconnect();
    }
  }

  private async runMaven(
    pomPath: string,
    args: string[],
    stdin: string,
    options: childProcess.ExecFileOptions
  ): Promise<MavenExecutionResult> {
    return new Promise((resolve, reject) => {
      const mvnCommand = this.configurationProvider.getUseMvnd()
        ? this.configurationProvider.getMvndPath()
        : 'mvn';

      const argsWithPom = ['-f', pomPath, ...args];

      this.logger.trace(`Executing maven: ${mvnCommand}`, ...argsWithPom);

      this.activeProcess = childProcess.execFile(
        mvnCommand,
        argsWithPom,
        options,
        (error, stdout, stderr) => {
          if (error) {
            this.logger.error(`Maven execution failed: ${stdout}`);
            reject(error);
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

export default ChildProcessExecutor;
