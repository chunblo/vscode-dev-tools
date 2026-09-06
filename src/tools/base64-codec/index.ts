import * as vscode from 'vscode';
import { runTransformCommand } from '../../shared/transform-runner';
import { base64Encode, base64Decode } from './transforms';

export function registerBase64Codec(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('dev-tools.base64Codec', async () => {
            const choice = await vscode.window.showQuickPick(['Encode', 'Decode'], {
                placeHolder: 'Base64: choose operation',
                ignoreFocusOut: true,
            });
            if (!choice) {
                return;
            }
            const isEncode = choice === 'Encode';
            await runTransformCommand({
                prefix: 'Base64',
                language: 'plaintext',
                transform: isEncode ? base64Encode : base64Decode,
                successMessage: 'Base64 result displayed in new document.',
                errorMessage: isEncode ? 'Unable to process the content.' : 'Invalid Base64 input.',
                openLabel: 'Select text file',
                filters: { 'Text Files': ['txt', 'md', 'log', 'json'], 'All Files': ['*'] },
            });
        }),
    );
}