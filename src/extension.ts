import * as vscode from 'vscode';
import getPomPath from './maven/getPomPath';
import Spotless from './spotless';
import ChildProcessExecutor from './maven/childProcessExecutor';
import DocumentFormattingEditProvider from './documentFormattingEditProvider';
import Logger from './logger';

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  const logger = new Logger(
    vscode.window.createOutputChannel('Spotless for Maven', { log: true })
  );

  logger.info('Extension initialised');

  const executor = new ChildProcessExecutor(logger);
  const spotless = new Spotless(executor, logger);

  const formatDocumentSelector: vscode.DocumentFilter[] = [
    { language: 'java', scheme: 'file' },
  ];

  const documentFormattingEditProvider = new DocumentFormattingEditProvider(
    spotless,
    formatDocumentSelector,
    logger
  );

  const formatter = vscode.languages.registerDocumentFormattingEditProvider(
    'java',
    documentFormattingEditProvider
  );

  context.subscriptions.push(formatter, executor, logger);
}

export function deactivate(): void {}
