import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { resolveWorkspaceRepoRoot } from '../../shared/git';

const execAsync = promisify(exec);

function showError(message: string): void {
    vscode.window.showErrorMessage(`Git Commit Url: ${message}`);
}

function showInfo(message: string): void {
    vscode.window.showInformationMessage(`Git Commit Url: ${message}`);
}

async function execCommand(command: string, cwd?: string): Promise<string> {
    const { stdout, stderr } = await execAsync(command, { cwd });
    if (stderr) {
        console.warn(`[exec] ${command} stderr: ${stderr}`);
    }
    return stdout.trim();
}

async function getGitRemoteUrl(cwd?: string): Promise<string | null> {
    try {
        return await execCommand('git config --get remote.origin.url', cwd);
    } catch {
        return null;
    }
}

function parseGitHubRepo(remoteUrl: string): { owner: string; repo: string } | null {
    const sshMatch = remoteUrl.match(/^git@github\.com:(.+)\/(.+)\.git$/);
    if (sshMatch) {
        return { owner: sshMatch[1], repo: sshMatch[2] };
    }
    const httpsMatch = remoteUrl.match(/^https:\/\/github\.com\/(.+)\/(.+)\.git$/);
    if (httpsMatch) {
        return { owner: httpsMatch[1], repo: httpsMatch[2] };
    }
    return null;
}

interface CommitItem extends vscode.QuickPickItem {
    fullHash: string;
}

export async function registerGitCommitUrl(context: vscode.ExtensionContext): Promise<void> {
    const command = vscode.commands.registerCommand('dev-tools.gitCommitUrl', async () => {
        const cwd = await resolveWorkspaceRepoRoot();
        if (!cwd) {
            showError('No git repository found.');
            return;
        }

        const config = vscode.workspace.getConfiguration('dev-tools');
        const commitCount = config.get<number>('gitCommitUrlCount', 50);

        const remoteUrl = await getGitRemoteUrl(cwd);
        if (!remoteUrl) {
            showError('No git remote found.');
            return;
        }

        const repoInfo = parseGitHubRepo(remoteUrl);
        if (!repoInfo) {
            showError('Could not parse GitHub repository from remote URL.');
            return;
        }

        const { owner, repo } = repoInfo;

        let logOutput: string;
        try {
            logOutput = await execCommand(
                `git log --format="%H %s" -n ${commitCount}`,
                cwd
            );
        } catch {
            showError('Failed to get git log. Make sure this is a git repository.');
            return;
        }

        if (!logOutput) {
            showError('No commits found.');
            return;
        }

        const commits: CommitItem[] = logOutput
            .split('\n')
            .filter((line) => line.includes(' '))
            .map((line) => {
                const firstSpace = line.indexOf(' ');
                const fullHash = line.substring(0, firstSpace);
                const message = line.substring(firstSpace + 1);
                const shortHash = fullHash.substring(0, 7);
                return {
                    label: `${shortHash} — ${message}`,
                    fullHash,
                };
            });

        const selection = await vscode.window.showQuickPick(commits, {
            placeHolder: 'Select commit(s) to copy their URL(s)',
            canPickMany: true,
            matchOnDetail: false,
        });

        if (!selection || selection.length === 0) {
            return;
        }

        const urls = selection.map(
            (item) => `https://github.com/${owner}/${repo}/commit/${item.fullHash}`
        );
        await vscode.env.clipboard.writeText(urls.join('\n'));
        showInfo(`Copied ${urls.length} commit URL(s) to clipboard.`);
    });

    context.subscriptions.push(command);
}