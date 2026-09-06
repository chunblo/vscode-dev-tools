import * as vscode from 'vscode';
import { runTransformCommand } from '../../shared/transform-runner';
import { decodeJwt } from './transforms';

export function registerJwtDecode(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('dev-tools.jwtDecode', () =>
            runTransformCommand({
                prefix: 'JWT',
                language: 'json',
                transform: decodeJwt,
                successMessage: 'JWT decoded to header and payload.',
                errorMessage: 'No valid JWT found in the content.',
                openLabel: 'Select text file',
                filters: { 'Text Files': ['txt', 'log', 'json'], 'All Files': ['*'] },
            }),
        ),
    );
}