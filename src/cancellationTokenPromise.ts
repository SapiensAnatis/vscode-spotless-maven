import * as vscode from 'vscode';

class CancellationTokenPromise {
  public promise: Promise<never>;

  private _resolve?: (value: never) => void;

  constructor(cancellationToken: vscode.CancellationToken) {
    this.promise = new Promise((resolve) => {
      this._resolve = resolve;
    });

    cancellationToken.onCancellationRequested(() => this._resolve);
  }
}

export default CancellationTokenPromise;
