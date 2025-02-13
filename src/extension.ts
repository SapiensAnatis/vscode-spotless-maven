import * as vscode from 'vscode';
import Spotless from './spotless';
import BasicMavenExecutor from './maven/basicMavenExecutor';
import DaemonMavenExecutor from './maven/daemonMavenExecutor';
import DocumentFormattingEditProvider from './documentFormattingEditProvider';
import Logger from './logger';
import ConfigurationProvider from './configurationProvider';

export async function activate(
  context: vscode.ExtensionContext
): Promise<void> {
  const logger = new Logger(
    vscode.window.createOutputChannel('Spotless for Maven', { log: true })
  );

  logger.info('Extension initialised');

  const configurationProvider = new ConfigurationProvider();

  const executor = configurationProvider.getUseMvnd()
    ? new DaemonMavenExecutor(configurationProvider, logger)
    : new BasicMavenExecutor(configurationProvider, logger);

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

  context.subscriptions.push(
    logger,
    configurationProvider,
    formatter,
    documentFormattingEditProvider
  );
}

export function deactivate(): void {}
