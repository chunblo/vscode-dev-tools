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

/**
 * Recursively finds all git repositories (including nested submodules) within a root directory.
 * @param rootPath The root directory to search within
 * @returns Array of absolute paths to each git repository found
 */
export function findAllGitRepos(rootPath: string): string[] {
    const repos: string[] = [];
    
    function scanDir(dir: string): void {
        const gitPath = path.join(dir, '.git');
        
        // Check if .git exists
        if (fs.existsSync(gitPath)) {
            repos.push(dir);
            
            // If .git is a directory (regular repo), we still want to scan
            // subdirectories to find nested submodules
            // If .git is a file (submodule), don't recurse into it
            try {
                const gitStat = fs.statSync(gitPath);
                if (gitStat.isFile()) {
                    // It's a submodule (file), don't recurse into it
                    return;
                }
                // It's a directory (regular repo), continue to scan subdirectories
            } catch {
                return;
            }
        }
        
        // Recursively scan subdirectories, skipping common non-repo directories
        let entries: string[] = [];
        try {
            entries = fs.readdirSync(dir);
        } catch {
            return; // Can't read directory, skip it
        }
        
        for (const entry of entries) {
            // Skip common non-repo directories
            // Note: We do NOT skip hidden directories (.git, .svn, etc.) here
            // because we check for .git at the start of scanDir()
            if (entry === 'node_modules' || 
                entry === 'vendor' ||
                entry === 'bower_components' ||
                entry === '__pycache__') {
                continue;
            }
            
            const fullPath = path.join(dir, entry);
            
            // Only recurse into directories
            try {
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    scanDir(fullPath);
                }
            } catch {
                // Skip if we can't stat the entry
            }
        }
    }
    
    scanDir(rootPath);
    return repos;
}

interface WorkspaceRepoQuickPickItem extends vscode.QuickPickItem {
    repoRoot: string;
}

export async function resolveWorkspaceRepoRoot(): Promise<string | undefined> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return undefined;
    }

    // Collect all repos from all workspace folders, including nested repos/submodules
    const allRepos: { folderName: string; repoRoot: string }[] = [];
    
    for (const folder of workspaceFolders) {
        const repos = findAllGitRepos(folder.uri.fsPath);
        for (const repoRoot of repos) {
            allRepos.push({
                folderName: folder.name,
                repoRoot,
            });
        }
    }

    if (allRepos.length === 0) {
        return undefined;
    }

    // If only one repo found, return it directly
    if (allRepos.length === 1) {
        return allRepos[0].repoRoot;
    }

    // Build quick pick items with relative path as label
    const repoItems: WorkspaceRepoQuickPickItem[] = allRepos.map((repo, index) => {
        // Get relative path from workspace folder for display
        const workspaceFolder = workspaceFolders.find(f => f.name === repo.folderName);
        const relativePath = workspaceFolder 
            ? path.relative(workspaceFolder.uri.fsPath, repo.repoRoot)
            : repo.repoRoot;
        
        // Use relative path as label, or just the repo root if at workspace root
        const label = relativePath === '' ? path.basename(repo.repoRoot) : relativePath;
        
        return {
            label,
            description: repo.repoRoot,
            repoRoot: repo.repoRoot,
        };
    });

    const selected = await vscode.window.showQuickPick(repoItems, {
        title: 'Select Repository',
        placeHolder: 'Choose the repository for this command (including nested submodules)',
    });

    return selected?.repoRoot;
}