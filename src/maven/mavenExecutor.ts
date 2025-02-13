import * as vscode from 'vscode';

export type MavenExecutionArgs = {
  pomUri: vscode.Uri;
  documentUri: vscode.Uri;
  documentText: string;
  cancellationToken: vscode.CancellationToken;
};

export type MavenExecutionResult = {
  formattedDocumentText: string;
  spotlessStatus: string;
};

interface MavenExecutor extends vscode.Disposable {
  runSpotlessApply(args: MavenExecutionArgs): Promise<MavenExecutionResult>;
}

export default MavenExecutor;
