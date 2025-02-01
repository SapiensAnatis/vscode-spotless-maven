import * as vscode from 'vscode';
import MavenExecutor from './maven/mavenExecutor';
import Spotless from './spotless';

class DocumentFormattingEditProvider
  implements vscode.DocumentFormattingEditProvider, vscode.Disposable
{
  private documentFormattingEditProvider: vscode.Disposable | undefined;

  constructor(
    private spotless: Spotless,
    private documentSelector: vscode.DocumentSelector
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
      const spotlessChanges = await this.spotless.run(document, token);

      if (!spotlessChanges) {
        return [];
      }

      const range = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      );

      return [new vscode.TextEdit(range, spotlessChanges)];
    } catch (e) {
      console.error(`Unable to apply formatting: ${(e as Error).message}`);
      return [];
    }
  }

  public dispose(): void {
    this.documentFormattingEditProvider?.dispose();
  }
}

export default DocumentFormattingEditProvider;
