import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

export function findGitRoot(startPath: string): string | null {
    let dir = startPath;
    if (fs.existsSync(startPath) && !fs.statSync(startPath).isDirectory()) {
        dir = path.dirname(startPath);
    }

    while (true) {
        if (fs.existsSync(path.join(dir, '.git'))) {
            return dir;
        }
        const parent = path.dirname(dir);
        if (parent === dir) {
            break;
        }
        dir = parent;
    }
    return null;
}

interface WorkspaceRepoQuickPickItem extends vscode.QuickPickItem {
    repoRoot: string;
}

export async function resolveWorkspaceRepoRoot(): Promise<string | undefined> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return undefined;
    }

    if (workspaceFolders.length === 1) {
        return findGitRoot(workspaceFolders[0].uri.fsPath) ?? undefined;
    }

    const repoItems: WorkspaceRepoQuickPickItem[] = [];
    for (const folder of workspaceFolders) {
        const repoRoot = findGitRoot(folder.uri.fsPath);
        if (!repoRoot) {
            continue;
        }

        repoItems.push({
            label: folder.name,
            description: folder.uri.fsPath,
            detail: repoRoot,
            repoRoot,
        });
    }

    if (repoItems.length === 0) {
        return undefined;
    }

    const selected = await vscode.window.showQuickPick(repoItems, {
        title: 'Select Repository',
        placeHolder: 'Choose the repository for this command',
    });

    return selected?.repoRoot;
}