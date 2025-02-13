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
  private properties = {
    mvnPath: new ConfigurationProperty<string>('mvnPath', '/usr/bin/mvn'),
    useMvnd: new ConfigurationProperty<boolean>('useMvnd', false), // TODO: changing this should prompt to reload the window as we only read it on startup
    mvndPath: new ConfigurationProperty<string>('mvndPath', '/usr/bin/mvnd'),
  };

  private subscriptionListener: vscode.Disposable;

  constructor() {
    this.subscriptionListener = vscode.workspace.onDidChangeConfiguration(
      this.onConfigurationChange.bind(this)
    );
  }

  public getMvnPath(): string {
    return this.properties.mvnPath.getValue();
  }

  public getUseMvnd(): boolean {
    return this.properties.useMvnd.getValue();
  }

  public getMvndPath(): string {
    return this.properties.mvndPath.getValue();
  }

  public dispose(): void {
    this.subscriptionListener.dispose();
  }

  private onConfigurationChange(event: vscode.ConfigurationChangeEvent): void {
    for (const configProperty of Object.values(this.properties)) {
      configProperty.onConfigurationChange(event);
    }
  }
}

export default ConfigurationProvider;
