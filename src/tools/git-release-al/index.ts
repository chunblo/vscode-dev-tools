import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import archiver from 'archiver';
import { resolveWorkspaceRepoRoot } from '../../shared/git';

const execAsync = promisify(exec);

function showError(message: string): void {
    vscode.window.showErrorMessage(`Git Release (Zip): ${message}`);
}

function showInfo(message: string): void {
    vscode.window.showInformationMessage(`Git Release (Zip): ${message}`);
}

async function execCommand(command: string, cwd?: string): Promise<string> {
    const { stdout, stderr } = await execAsync(command, { cwd });
    if (stderr) {
        console.warn(`[exec] ${command} stderr: ${stderr}`);
    }
    return stdout.trim();
}

async function checkCommandExists(command: string): Promise<boolean> {
    try {
        await execAsync(`which ${command}`);
        return true;
    } catch {
        return false;
    }
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

async function tagExists(tag: string, cwd: string): Promise<boolean> {
    try {
        await execCommand(`git rev-parse ${tag}`, cwd);
        return true;
    } catch {
        return false;
    }
}

async function releaseExists(tag: string, owner: string, repo: string, cwd: string): Promise<boolean> {
    try {
        await execCommand(`gh release view "${tag}" --repo "${owner}/${repo}"`, cwd);
        return true;
    } catch {
        return false;
    }
}

async function createAndPushTag(tag: string, cwd: string): Promise<void> {
    await execCommand(`git tag ${tag}`, cwd);
    await execCommand(`git push origin ${tag}`, cwd);
}

function createZip(sourcePath: string, zipPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', () => resolve());
        archive.on('error', (err) => reject(err));

        archive.pipe(output);
        archive.file(sourcePath, { name: path.basename(sourcePath) });
        archive.finalize();
    });
}

export async function registerGitReleaseAl(context: vscode.ExtensionContext): Promise<void> {
    const command = vscode.commands.registerCommand('dev-tools.gitReleaseAl', async () => {
        const repoRoot = await resolveWorkspaceRepoRoot();
        if (!repoRoot) {
            showError('No git repository found.');
            return;
        }

        const appFile = await vscode.window.showOpenDialog({
            title: 'Select File for Release',
            openLabel: 'Select file',
            canSelectMany: false,
            filters: { 'All Files': ['*'] },
            defaultUri: vscode.Uri.file(repoRoot),
        });

        if (!appFile) {
            return;
        }

        const appPath = appFile[0].fsPath;

        if (!fs.existsSync(appPath)) {
            showError(`File does not exist: ${appPath}`);
            return;
        }

        if (!fs.statSync(appPath).isFile()) {
            showError(`Path is not a file: ${appPath}`);
            return;
        }

        const cwd = repoRoot;

        const tag = await vscode.window.showInputBox({
            title: 'Tag Name',
            prompt: 'Enter the git tag name (e.g. v1.0.0)',
            validateInput: (value) => {
                if (!value || value.trim() === '') {
                    return 'Tag name is required';
                }
                return null;
            },
        });

        if (!tag) {
            return;
        }

        const appName = path.basename(appPath);
        const appExt = path.extname(appName);
        const zipName = (appExt ? appName.slice(0, -appExt.length) : appName) + '.zip';

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Git Release (Zip)',
                cancellable: false,
            },
            async (progress) => {
                try {
                    progress.report({ message: 'Checking gh CLI installation...' });
                    if (!(await checkCommandExists('gh'))) {
                        showError('GitHub CLI (gh) is not installed. Please install it first.');
                        return;
                    }

                    progress.report({ message: 'Checking gh CLI authentication...' });
                    try {
                        await execCommand('gh auth status');
                    } catch {
                        showError('Not authenticated with GitHub CLI. Please run "gh auth login" first.');
                        return;
                    }

                    progress.report({ message: 'Getting git remote URL...' });
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

                    progress.report({ message: `Checking if tag "${tag}" exists...` });
                    let tagCreated = false;
                    if (!(await tagExists(tag, cwd))) {
                        progress.report({ message: `Tag "${tag}" does not exist. Prompting user...` });
                        const action = await vscode.window.showInformationMessage(
                            `Tag "${tag}" does not exist. Create and push it?`,
                            { modal: true },
                            'Create & Push',
                            'Cancel'
                        );

                        if (action === 'Create & Push') {
                            progress.report({ message: 'Creating and pushing tag...' });
                            await createAndPushTag(tag, cwd);
                            tagCreated = true;
                        } else {
                            showInfo('Release cancelled.');
                            return;
                        }
                    }

                    progress.report({ message: `Checking if release "${tag}" already exists...` });
                    if (await releaseExists(tag, owner, repo, cwd)) {
                        const action = await vscode.window.showWarningMessage(
                            `A GitHub release for tag "${tag}" already exists. Delete it first?`,
                            { modal: true },
                            'Delete & Recreate',
                            'Cancel'
                        );

                        if (action !== 'Delete & Recreate') {
                            showInfo('Release cancelled.');
                            return;
                        }

                        progress.report({ message: 'Deleting existing GitHub release...' });
                        await execCommand(
                            `gh release delete "${tag}" --repo "${owner}/${repo}" --yes`,
                            cwd
                        );
                    }

                    progress.report({ message: 'Creating zip archive...' });
                    const zipPath = path.join(cwd, zipName);
                    if (fs.existsSync(zipPath)) {
                        fs.unlinkSync(zipPath);
                    }
                    await createZip(appPath, zipPath);

                    progress.report({ message: 'Creating GitHub release...' });
                    const releaseUrl = `https://github.com/${owner}/${repo}/releases/tag/${tag}`;
                    await execCommand(
                        `gh release create ${tag} --title "${tag}" --notes "Automated release for ${tag}" --repo ${owner}/${repo} "${zipName}"`,
                        cwd
                    );

                    await vscode.env.clipboard.writeText(releaseUrl);

                    fs.unlinkSync(zipPath);

                    progress.report({ message: 'Done!' });
                    showInfo(`Release created and URL copied to clipboard!${tagCreated ? ' (Tag created and pushed)' : ''}`);
                } catch (err) {
                    const error = err as Error;
                    showError(`Failed: ${error.message}`);
                }
            }
        );
    });

    context.subscriptions.push(command);
}
