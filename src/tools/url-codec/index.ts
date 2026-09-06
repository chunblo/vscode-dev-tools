import * as vscode from 'vscode';
import { runTransformCommand } from '../../shared/transform-runner';
import { urlEncode, urlDecode } from './transforms';

export function registerUrlCodec(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('dev-tools.urlCodec', async () => {
            const choice = await vscode.window.showQuickPick(['Encode', 'Decode'], {
                placeHolder: 'URL: choose operation',
                ignoreFocusOut: true,
            });
            if (!choice) {
                return;
            }
            const isEncode = choice === 'Encode';
            await runTransformCommand({
                prefix: 'URL',
                language: 'plaintext',
                transform: isEncode ? urlEncode : urlDecode,
                successMessage: 'URL result displayed in new document.',
                errorMessage: isEncode ? 'Unable to process the content.' : 'Invalid URL-encoded input.',
                openLabel: 'Select text file',
                filters: { 'Text Files': ['txt', 'md', 'log', 'json'], 'All Files': ['*'] },
            });
        }),
    );
}