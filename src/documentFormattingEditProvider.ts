import * as vscode from 'vscode';
import Spotless from './spotless';
import Logger from './logger';

class DocumentFormattingEditProvider
  implements vscode.DocumentFormattingEditProvider, vscode.Disposable
{
  private documentFormattingEditProvider: vscode.Disposable | undefined;

  constructor(
    private spotless: Spotless,
    private documentSelector: vscode.DocumentSelector,
    private logger: Logger
  ) {}

  public register(): void {
    this.documentFormattingEditProvider =
      vscode.languages.registerDocumentFormattingEditProvider(
        this.documentSelector,
        this
      );
  }

  async provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    options: vscode.FormattingOptions,
    token: vscode.CancellationToken
  ): Promise<vscode.TextEdit[]> {
    try {
      this.logger.debug('Starting formatting');

      const spotlessChanges = await this.spotless.run(document, token);

      if (!spotlessChanges) {
        return [];
      }

      const range = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      );

      this.logger.info('Formatting completed');

      return [new vscode.TextEdit(range, spotlessChanges)];
    } catch (e) {
      this.logger.error(`Unable to apply formatting: ${(e as Error).message}`);
      return [];
    }
  }

  public dispose(): void {
    this.documentFormattingEditProvider?.dispose();
    this.spotless.dispose();
  }
}

export default DocumentFormattingEditProvider;
