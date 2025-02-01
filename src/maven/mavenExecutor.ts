import * as vscode from 'vscode';

export type MavenExecutionArgs = {
  documentLocation: vscode.Uri;
  plugin: string;
  goal: string;
  goalArgs: string[];
  stdin: string;
  cancellationToken: vscode.CancellationToken;
};

export type MavenExecutionResult = {
  stdout: string;
  stderr: string;
};

interface MavenExecutor extends vscode.Disposable {
  runPluginGoal({
    documentLocation,
    plugin,
    goal,
    goalArgs,
    stdin,
    cancellationToken,
  }: MavenExecutionArgs): Promise<MavenExecutionResult>;
}

export default MavenExecutor;
