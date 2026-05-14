import * as vscode from 'vscode';
import { convertToJira } from './converter';
import { registerGitReleaseAl } from './tools/git-release-al';
import { registerGitCommitUrl } from './tools/git-commit-url';
import { registerParseStringifiedJson } from './tools/parse-stringified-json';

export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('dev-tools.exportCloud', () => exportToJira('cloud')),
        vscode.commands.registerCommand('dev-tools.exportServer', () => exportToJira('server')),
    );
    registerGitReleaseAl(context);
    registerGitCommitUrl(context);
    registerParseStringifiedJson(context);
}

export function deactivate(): void {}

async function exportToJira(mode: 'cloud' | 'server'): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        vscode.window.showErrorMessage('MD to JIRA: No active editor open.');
        return;
    }

    const text = editor.document.getText();
    const jiraText = convertToJira(text, mode);
    await vscode.env.clipboard.writeText(jiraText);

    const label = mode === 'cloud' ? 'Cloud (Markdown)' : 'Server (Wiki Markup)';
    vscode.window.showInformationMessage(`MD to JIRA: Copied to clipboard as ${label}!`);
}
