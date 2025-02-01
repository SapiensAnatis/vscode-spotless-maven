// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import getPomPath from './maven/getPomPath';
import Spotless from './spotless';
import ChildProcessExecutor from './maven/childProcessExecutor';
import DocumentFormattingEditProvider from './documentFormattingEditProvider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "vscode-spotless-maven" is now active!'
  );

  const pomUri = await getPomPath();

  if (!pomUri) {
    console.log('No Maven project found.');
    return;
  }

  console.log(`Found Maven project: ${pomUri}`);

  const executor = new ChildProcessExecutor();
  const spotless = new Spotless(executor);
  const formatDocumentSelector: vscode.DocumentFilter[] = [
    { language: 'java', scheme: 'file' },
  ];

  const documentFormattingEditProvider = new DocumentFormattingEditProvider(
    spotless,
    formatDocumentSelector
  );

  const formatter = vscode.languages.registerDocumentFormattingEditProvider(
    'java',
    documentFormattingEditProvider
  );

  context.subscriptions.push(formatter, executor);
}

// This method is called when your extension is deactivated
export function deactivate(): void {}
