import * as vscode from 'vscode';
import { runTransformCommand } from '../../shared/transform-runner';
import { textMinify } from './transforms';

export function registerTextTools(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('dev-tools.textMinify', () =>
            runTransformCommand({
                prefix: 'Text - Minify',
                language: 'plaintext',
                transform: textMinify,
                successMessage: 'Minified and displayed in new document.',
                errorMessage: 'Unable to process the content.',
                openLabel: 'Select text file',
                filters: { 'Text Files': ['txt', 'md', 'log'], 'All Files': ['*'] },
            }),
        ),
    );
}