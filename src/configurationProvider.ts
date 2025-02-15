import * as vscode from 'vscode';
import findCommandPath from './maven/findCommandPath';

const CONFIG_NAMESPACE = 'spotlessMaven';

class ConfigurationProperty<TValue> {
  private value: TValue | null;

  constructor(
    protected propertyName: string,
    private defaultValue: TValue
  ) {
    this.value = null;
  }

  public getValue(): TValue {
    if (!this.value) {
      this.value = this.loadValue();
    }

    return this.value;
  }

  public onConfigurationChange(event: vscode.ConfigurationChangeEvent): void {
    if (
      event.affectsConfiguration(`${CONFIG_NAMESPACE}.${this.propertyName}`)
    ) {
      this.value = this.loadValue();
    }
  }

  protected loadValue(): TValue {
    return vscode.workspace
      .getConfiguration(CONFIG_NAMESPACE)
      .get(this.propertyName, this.defaultValue);
  }
}

class MavenBinaryPathProperty extends ConfigurationProperty<string | null> {
  constructor(
    propertyName: string,
    private binaryName: 'mvn' | 'mvnd'
  ) {
    super(propertyName, null);
  }

  protected loadValue(): string | null {
    const configOverride = vscode.workspace
      .getConfiguration(CONFIG_NAMESPACE)
      .get(this.propertyName, null);

    if (configOverride) {
      return configOverride;
    }

    return findCommandPath(this.binaryName);
  }
}

class UseMvndProperty extends ConfigurationProperty<boolean> {
  constructor() {
    super('useMvnd', false);
  }

  public onConfigurationChange(event: vscode.ConfigurationChangeEvent): void {
    super.onConfigurationChange(event);

    if (
      event.affectsConfiguration(`${CONFIG_NAMESPACE}.${this.propertyName}`)
    ) {
      const reloadWindow = vscode.window.showInformationMessage(
        'mvnd usage setting changed - please reload the window to apply.',
        'Reload window'
      );

      reloadWindow.then((value) => {
        if (value) {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      });
    }
  }
}

class ConfigurationProvider implements vscode.Disposable {
  private properties = {
    mvnPath: new MavenBinaryPathProperty('mvnPath', 'mvn'),
    useMvnd: new UseMvndProperty(),
    mvndPath: new MavenBinaryPathProperty('mvndPath', 'mvnd'),
  };

  private subscriptionListener: vscode.Disposable;

  constructor() {
    this.subscriptionListener = vscode.workspace.onDidChangeConfiguration(
      this.onConfigurationChange.bind(this)
    );
  }

  public getMvnPath(): string | null {
    return this.properties.mvnPath.getValue();
  }

  public getUseMvnd(): boolean {
    return this.properties.useMvnd.getValue();
  }

  public getMvndPath(): string | null {
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
