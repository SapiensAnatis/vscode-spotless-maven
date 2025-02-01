import * as vscode from 'vscode';

const CONFIG_NAMESPACE = 'spotlessMaven';

class ConfigurationProperty<TValue> {
  private value: TValue;

  constructor(
    private propertyName: string,
    private defaultValue: TValue
  ) {
    this.value = this.loadValue();
  }

  public getValue(): TValue {
    return this.value;
  }

  public onConfigurationChange(event: vscode.ConfigurationChangeEvent): void {
    if (
      event.affectsConfiguration(`${CONFIG_NAMESPACE}.${this.propertyName}`)
    ) {
      this.value = this.loadValue();
    }
  }

  private loadValue(): TValue {
    return vscode.workspace
      .getConfiguration(CONFIG_NAMESPACE)
      .get(this.propertyName, this.defaultValue);
  }
}

class ConfigurationProvider implements vscode.Disposable {
  private useMvnd = new ConfigurationProperty<boolean>('useMvnd', false);
  private mvndPath = new ConfigurationProperty<string>(
    'mvndPath',
    '/usr/bin/mvnd'
  );

  private subscriptionListener: vscode.Disposable;

  constructor() {
    this.subscriptionListener = vscode.workspace.onDidChangeConfiguration(
      this.onConfigurationChange.bind(this)
    );
  }

  public getUseMvnd(): boolean {
    return this.useMvnd.getValue();
  }

  public getMvndPath(): string {
    return this.mvndPath.getValue();
  }

  public dispose(): void {
    this.subscriptionListener.dispose();
  }

  private onConfigurationChange(event: vscode.ConfigurationChangeEvent): void {
    this.useMvnd.onConfigurationChange(event);
    this.mvndPath.onConfigurationChange(event);
  }
}

export default ConfigurationProvider;
