import * as vscode from 'vscode';

function showError(message: string): void {
    vscode.window.showErrorMessage(`Parse Stringified JSON: ${message}`);
}

function showInfo(message: string): void {
    vscode.window.showInformationMessage(`Parse Stringified JSON: ${message}`);
}

async function parseStringifiedJson(): Promise<void> {
    // Step 1: Ask user to choose input source
    const choice = await vscode.window.showQuickPick(
        [
            { label: '$(file) Use Current Editor File', description: 'Parse the currently open file', value: 'current' },
            { label: '$(folder) Select File from Explorer', description: 'Browse and select a file', value: 'select' }
        ],
        {
            placeHolder: 'Choose input source for JSON parsing',
            ignoreFocusOut: true
        }
    );

    if (!choice) {
        return; // User cancelled
    }

    let content: string;

    if (choice.value === 'current') {
        // Use current editor file
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            showError('No active editor open.');
            return;
        }
        content = editor.document.getText();
    } else {
        // Select file from explorer
        const uri = await vscode.window.showOpenDialog({
            canSelectMany: false,
            openLabel: 'Select JSON file to parse',
            filters: {
                'JSON Files': ['json', 'txt', 'js', 'ts'],
                'All Files': ['*']
            }
        });

        if (!uri || uri.length === 0) {
            return; // User cancelled
        }

        try {
            const document = await vscode.workspace.openTextDocument(uri[0]);
            content = document.getText();
        } catch (err) {
            showError(`Failed to read file: ${err}`);
            return;
        }
    }

    // Step 2: Parse the JSON content
    // For huge JSON, we avoid double-parsing and use a single parse with error handling
    let parsed: unknown;
    let needsSecondParse = false;

    // First attempt: try to parse directly
    try {
        parsed = JSON.parse(content);
    } catch {
        // If direct parse fails, it might be a stringified JSON (double-encoded)
        // Try to extract and parse the inner JSON string
        try {
            const intermediate = JSON.parse(content);
            if (typeof intermediate === 'string') {
                // Try to parse the string as JSON
                parsed = JSON.parse(intermediate);
                needsSecondParse = true;
            } else {
                // It's a valid JSON but not a string - just return it as-is
                parsed = intermediate;
            }
        } catch {
            showError('Invalid JSON: Unable to parse the content.');
            return;
        }
    }

    // Step 3: Format the result with pretty printing
    let formattedResult: string;
    try {
        formattedResult = JSON.stringify(parsed, null, 2);
    } catch (err) {
        showError(`Failed to format JSON: ${err}`);
        return;
    }

    // Step 4: Create a new untitled document with the parsed result (do not save)
    const newDocument = await vscode.workspace.openTextDocument({
        content: formattedResult,
        language: 'json'
    });

    await vscode.window.showTextDocument(newDocument, {
        viewColumn: vscode.ViewColumn.Beside,
        preview: true
    });

    const infoMessage = needsSecondParse
        ? 'Stringified JSON parsed and displayed in new untitled document.'
        : 'JSON parsed and displayed in new untitled document.';
    showInfo(infoMessage);
}

export async function registerParseStringifiedJson(context: vscode.ExtensionContext): Promise<void> {
    const command = vscode.commands.registerCommand('dev-tools.parseStringifiedJson', async () => {
        await parseStringifiedJson();
    });

    context.subscriptions.push(command);
}