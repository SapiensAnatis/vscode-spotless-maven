import * as vscode from 'vscode';

export class Logger implements vscode.Disposable {
  constructor(private channel: vscode.LogOutputChannel) {}

  public info(...messages: string[]): void {
    this.channel.info(messages.join(' '));
  }

  public warning(...messages: string[]): void {
    this.channel.warn(messages.join(' '));
  }

  public error(...messages: string[]): void {
    this.channel.error(messages.join(' '));
  }

  public debug(...messages: string[]): void {
    this.channel.debug(messages.join(' '));
  }

  public trace(...messages: string[]): void {
    this.channel.trace(messages.join(' '));
  }

  dispose(): void {
    this.channel.dispose();
  }
}

export default Logger;
