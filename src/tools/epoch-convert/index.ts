import * as vscode from 'vscode';
import { epochToIso, isoToEpoch, nowIso } from './transforms';

async function getInput(placeHolder: string): Promise<string | undefined> {
    const editor = vscode.window.activeTextEditor;
    if (editor && !editor.selection.isEmpty) {
        const text = editor.document.getText(editor.selection);
        if (text.trim().length > 0) {
            return text;
        }
    }
    return vscode.window.showInputBox({ placeHolder, ignoreFocusOut: true });
}

export function registerEpochConvert(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('dev-tools.epochConvert', async () => {
            const choice = await vscode.window.showQuickPick(
                ['Current time → ISO 8601', 'Epoch → ISO 8601', 'ISO 8601 → Epoch seconds'],
                { placeHolder: 'Epoch Convert: choose conversion', ignoreFocusOut: true },
            );
            if (!choice) {
                return;
            }

            if (choice === 'Current time → ISO 8601') {
                const iso = nowIso();
                await vscode.env.clipboard.writeText(iso);
                vscode.window.showInformationMessage('Epoch Convert: Copied current ISO time.');
                return;
            }

            const isEpochToIso = choice === 'Epoch → ISO 8601';
            const input = await getInput(isEpochToIso ? 'Enter epoch seconds/ms' : 'Enter ISO 8601 date');
            if (input === undefined) {
                return;
            }

            try {
                const result = isEpochToIso ? epochToIso(input) : isoToEpoch(input);
                await vscode.env.clipboard.writeText(result);
                vscode.window.showInformationMessage(`Epoch Convert: Copied ${result}.`);
            } catch (err) {
                vscode.window.showErrorMessage(`Epoch Convert: ${(err as Error).message}`);
            }
        }),
    );
}