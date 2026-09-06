import * as vscode from 'vscode';
import { lineOperations } from './transforms';

export function registerLineTools(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('dev-tools.lineTools', async () => {
            const label = await vscode.window.showQuickPick(Object.keys(lineOperations), {
                placeHolder: 'Choose line operation',
                ignoreFocusOut: true,
            });
            if (!label) {
                return;
            }

            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('Lines: No active editor open.');
                return;
            }

            const range = editor.selection.isEmpty
                ? new vscode.Range(0, 0, editor.document.lineCount, 0)
                : editor.selection;
            const original = editor.document.getText(range);
            const converted = lineOperations[label](original);

            await editor.edit((editBuilder) => editBuilder.replace(range, converted));
            vscode.window.showInformationMessage(`Lines: Applied ${label}.`);
        }),
    );
}