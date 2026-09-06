import * as vscode from 'vscode';
import { runTransformCommand } from '../../shared/transform-runner';
import { jsonParse, jsonMinify, jsonStringify } from './transforms';

export async function registerJsonTools(context: vscode.ExtensionContext): Promise<void> {
    context.subscriptions.push(
        vscode.commands.registerCommand('dev-tools.jsonParse', () =>
            runTransformCommand({
                prefix: 'JSON - Parse',
                language: 'json',
                transform: jsonParse,
                successMessage: 'Parsed and displayed in new document.',
                errorMessage: 'Invalid JSON: Unable to process the content.',
                openLabel: 'Select JSON file',
                filters: { 'JSON Files': ['json', 'txt'], 'All Files': ['*'] },
            }),
        ),
        vscode.commands.registerCommand('dev-tools.jsonMinify', () =>
            runTransformCommand({
                prefix: 'JSON - Minify',
                language: 'json',
                transform: jsonMinify,
                successMessage: 'Minified and displayed in new document.',
                errorMessage: 'Invalid JSON: Unable to process the content.',
                openLabel: 'Select JSON file',
                filters: { 'JSON Files': ['json', 'txt'], 'All Files': ['*'] },
            }),
        ),
        vscode.commands.registerCommand('dev-tools.jsonStringify', () =>
            runTransformCommand({
                prefix: 'JSON - Stringify',
                language: 'json',
                transform: jsonStringify,
                successMessage: 'Stringified and displayed in new document.',
                errorMessage: 'Invalid JSON: Unable to process the content.',
                openLabel: 'Select JSON file',
                filters: { 'JSON Files': ['json', 'txt'], 'All Files': ['*'] },
            }),
        ),
    );
}