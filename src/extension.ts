import * as vscode from 'vscode';
import { convertToJira } from './converter';
import { registerGitReleaseAl } from './tools/git-release-al';
import { registerGitCommitUrl } from './tools/git-commit-url';
import { registerJsonTools } from './tools/parse-stringified-json';
import { registerTextTools } from './tools/minify-text';
import { registerGitCommitMessageAi } from './tools/git-commit-message-ai';
import { registerCaseConvert } from './tools/case-convert';
import { registerLineTools } from './tools/line-tools';
import { registerBase64Codec } from './tools/base64-codec';
import { registerUrlCodec } from './tools/url-codec';
import { registerJwtDecode } from './tools/jwt-decode';
import { registerEpochConvert } from './tools/epoch-convert';

import { jiraActivityCommand } from './tools/jira-activity';

export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('dev-tools.exportCloud', () => exportToJira('cloud')),
        vscode.commands.registerCommand('dev-tools.exportServer', () => exportToJira('server')),
        vscode.commands.registerCommand('dev-tools.jiraActivity', jiraActivityCommand),
    );
    registerGitReleaseAl(context);
    registerGitCommitUrl(context);
    registerJsonTools(context);
    registerTextTools(context);
    registerGitCommitMessageAi(context);
    registerCaseConvert(context);
    registerLineTools(context);
    registerBase64Codec(context);
    registerUrlCodec(context);
    registerJwtDecode(context);
    registerEpochConvert(context);
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
