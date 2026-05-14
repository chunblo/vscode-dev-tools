import * as vscode from 'vscode';
import { jsonParse, jsonMinify, jsonStringify } from './transforms';

function showError(prefix: string, message: string): void {
    vscode.window.showErrorMessage(`${prefix}: ${message}`);
}

function showInfo(prefix: string, message: string): void {
    vscode.window.showInformationMessage(`${prefix}: ${message}`);
}

async function pickContent(prefix: string): Promise<string | undefined> {
    const choice = await vscode.window.showQuickPick(
        [
            { label: '$(file) Use Current Editor File', description: 'Use the currently open file', value: 'current' },
            { label: '$(folder) Select File from Explorer', description: 'Browse and select a file', value: 'select' },
        ],
        { placeHolder: 'Choose input source', ignoreFocusOut: true },
    );

    if (!choice) {
        return undefined;
    }

    if (choice.value === 'current') {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            showError(prefix, 'No active editor open.');
            return undefined;
        }
        return editor.document.getText();
    }

    const uri = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: 'Select JSON file',
        filters: { 'JSON Files': ['json', 'txt'], 'All Files': ['*'] },
    });

    if (!uri || uri.length === 0) {
        return undefined;
    }

    try {
        const doc = await vscode.workspace.openTextDocument(uri[0]);
        return doc.getText();
    } catch (err) {
        showError(prefix, `Failed to read file: ${err}`);
        return undefined;
    }
}

async function openResult(content: string): Promise<void> {
    const doc = await vscode.workspace.openTextDocument({ content, language: 'json' });
    await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside, preview: true });
}

async function runJsonCommand(
    prefix: string,
    transform: (content: string) => string,
    successMessage: string,
): Promise<void> {
    const content = await pickContent(prefix);
    if (content === undefined) {
        return;
    }
    try {
        const result = transform(content);
        await openResult(result);
        showInfo(prefix, successMessage);
    } catch {
        showError(prefix, 'Invalid JSON: Unable to process the content.');
    }
}

export async function registerJsonTools(context: vscode.ExtensionContext): Promise<void> {
    context.subscriptions.push(
        vscode.commands.registerCommand('dev-tools.jsonParse', () =>
            runJsonCommand('JSON - Parse', jsonParse, 'Parsed and displayed in new document.'),
        ),
        vscode.commands.registerCommand('dev-tools.jsonMinify', () =>
            runJsonCommand('JSON - Minify', jsonMinify, 'Minified and displayed in new document.'),
        ),
        vscode.commands.registerCommand('dev-tools.jsonStringify', () =>
            runJsonCommand('JSON - Stringify', jsonStringify, 'Stringified and displayed in new document.'),
        ),
    );
}
