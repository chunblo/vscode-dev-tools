import * as vscode from 'vscode';
import { caseConverters } from './transforms';

export function registerCaseConvert(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('dev-tools.caseConvert', async () => {
            const label = await vscode.window.showQuickPick(Object.keys(caseConverters), {
                placeHolder: 'Choose target case',
                ignoreFocusOut: true,
            });
            if (!label) {
                return;
            }

            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('Case Convert: No active editor open.');
                return;
            }

            const range = editor.selection.isEmpty
                ? new vscode.Range(0, 0, editor.document.lineCount, 0)
                : editor.selection;
            const original = editor.document.getText(range);
            const converted = caseConverters[label](original);

            await editor.edit((editBuilder) => editBuilder.replace(range, converted));
            vscode.window.showInformationMessage(`Case Convert: Applied ${label}.`);
        }),
    );
}