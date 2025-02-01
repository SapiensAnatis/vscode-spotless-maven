import * as vscode from 'vscode';

async function getPomPath(): Promise<vscode.Uri | null> {
  const folders = vscode.workspace.workspaceFolders;

  for (const folder of folders ?? []) {
    const pattern = '**/pom.xml';
    const pomFileUris = await vscode.workspace.findFiles(
      new vscode.RelativePattern(folder, pattern)
    );

    if (pomFileUris.length > 0) {
      return pomFileUris[0];
    }
  }

  return null;
}

// todo: check if there is a spotless target

export default getPomPath;
