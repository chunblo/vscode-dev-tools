import * as vscode from 'vscode';
import * as https from 'https';
import * as http from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';
import { resolveWorkspaceRepoRoot } from '../../shared/git';

const execAsync = promisify(exec);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FileDiff {
    path: string;
    original: string;
    diff: string;
}

interface LlmProvider {
    baseUrl: string;
    apiKeyEnv: string | null;
    defaultModel: string | null;
}

// ---------------------------------------------------------------------------
// Constants (mirrored from Python script)
// ---------------------------------------------------------------------------

const PROVIDERS: Record<string, LlmProvider> = {
    lmstudio:  { baseUrl: 'http://127.0.0.1:1234', apiKeyEnv: null, defaultModel: null },
    litellm:   { baseUrl: 'http://127.0.0.1:4000', apiKeyEnv: 'LITELLM_API_KEY', defaultModel: null },
    nim:       { baseUrl: 'https://integrate.api.nvidia.com', apiKeyEnv: 'NVIDIA_API_KEY', defaultModel: 'minimaxai/minimax-m2.7' },
    openrouter:{ baseUrl: 'https://openrouter.ai/api', apiKeyEnv: 'OPENROUTER_API_KEY', defaultModel: 'openai/gpt-4o' },
};

const SYSTEM_PROMPT = `You are an AI programming assistant helping a developer write the best git commit message for their code changes.
You excel at interpreting the purpose behind code changes to craft succinct, clear commit messages.

Follow the Conventional Commits format:

<type>[optional scope]: <gitmoji> <description>

<body>

First, think step-by-step:
1. Analyze the CODE CHANGES thoroughly to understand what was modified.
2. Use the ORIGINAL CODE to understand the context — map the changes back to what was there before.
3. Identify the purpose of the changes to answer the *why* for the commit message.
4. Review RECENT COMMITS to match the established style and format (do NOT copy them).

Guidelines:
- Choose an appropriate type (feat, fix, chore, refactor, docs, test, style, ci, etc.)
- Include a relevant gitmoji representing the change
- Write a concise description; use backticks for code/term references
- ALWAYS include a body section with bullet points (*) that explains what changed and why

Output ONLY the commit message — no explanation, no markdown wrapper.`;

const CHARS_PER_TOKEN = 4;
const DIFF_TOKEN_BUDGET = 6000;
const ORIGINAL_TOKEN_BUDGET = 2000;
const RECENT_COMMIT_COUNT = 5;

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

async function execCommand(command: string, cwd?: string): Promise<string> {
    const options = cwd ? { cwd } : {};
    const { stdout, stderr } = await execAsync(command, options);
    if (stderr) {
        console.warn(`[exec] ${command} stderr: ${stderr}`);
    }
    return stdout.trim();
}

function showError(message: string): void {
    vscode.window.showErrorMessage(`Git Commit Message AI: ${message}`);
}

function showInfo(message: string): void {
    vscode.window.showInformationMessage(`Git Commit Message AI: ${message}`);
}

async function getRepoName(cwd?: string): Promise<string> {
    const remote = await execCommand('git remote get-url origin', cwd).catch(() => '');
    if (remote) {
        let name = remote.trim().replace(/\.git$/, '').split('/').pop() || '';
        return name;
    }
    const toplevel = await execCommand('git rev-parse --show-toplevel', cwd).catch(() => '');
    return toplevel ? toplevel.split('/').pop() || 'unknown' : 'unknown';
}

async function getBranchName(cwd?: string): Promise<string> {
    return execCommand('git rev-parse --abbrev-ref HEAD', cwd).catch(() => 'unknown');
}

async function getRecentCommits(cwd?: string, author?: string, count = RECENT_COMMIT_COUNT): Promise<string[]> {
    const args = ['log', '--oneline', `-${count}`];
    if (author) args.push(`--author=${author}`);
    const output = await execCommand(args.join(' '), cwd).catch(() => '');
    return output.split('\n').filter(line => line.trim());
}

async function getOriginalCode(filePath: string, cwd?: string): Promise<string> {
    return execCommand(`git show HEAD:${filePath}`, cwd).catch(() => '');
}

async function getStagedFileDiffs(cwd?: string): Promise<FileDiff[]> {
    const names = await execCommand('git diff --cached --name-only', cwd).catch(() => '');
    if (!names) return [];

    const result: FileDiff[] = [];
    for (const path of names.split('\n')) {
        if (!path.trim()) continue;
        const diff = await execCommand(`git diff --cached -- "${path}"`, cwd).catch(() => '');
        if (diff) {
            const original = await getOriginalCode(path, cwd);
            result.push({ path, original, diff });
        }
    }
    return result;
}

function selectDiffsForBudget(
    fileDiffs: FileDiff[],
    tokenBudget: number,
    originalBudget: number
): { included: FileDiff[]; dropped: number } {
    const included: FileDiff[] = [];
    let usedDiff = 0;
    let usedOriginal = 0;
    let dropped = 0;

    for (const fd of fileDiffs) {
        const diffTokens = fd.diff.length / CHARS_PER_TOKEN;
        if (usedDiff + diffTokens <= tokenBudget) {
            const origTokens = fd.original.length / CHARS_PER_TOKEN;
            if (usedOriginal + origTokens > originalBudget) {
                fd.original = ''; // omit original code if budget exceeded
            } else {
                usedOriginal += origTokens;
            }
            included.push(fd);
            usedDiff += diffTokens;
        } else {
            dropped++;
        }
    }
    return { included, dropped };
}

function buildUserPrompt(
    repoName: string,
    branchName: string,
    fileDiffs: FileDiff[],
    droppedCount: number,
    userCommits: string[],
    repoCommits: string[]
): string {
    const sections: string[] = [];

    sections.push(`# REPOSITORY DETAILS:\nRepository name: ${repoName}\nBranch name: ${branchName}`);

    if (userCommits.length) {
        sections.push(`# RECENT USER COMMITS (for style reference only, do NOT copy):\n${userCommits.map(c => `- ${c}`).join('\n')}`);
    }

    if (repoCommits.length) {
        sections.push(`# RECENT REPOSITORY COMMITS (for style reference only, do NOT copy):\n${repoCommits.map(c => `- ${c}`).join('\n')}`);
    }

    for (const fd of fileDiffs) {
        if (fd.original) {
            sections.push(`# ORIGINAL CODE: ${fd.path}\n\`\`\`\n${fd.original}\n\`\`\``);
        }
        sections.push(`# CODE CHANGES: ${fd.path}\n\`\`\`diff\n${fd.diff}\n\`\`\``);
    }

    if (droppedCount) {
        sections.push(`# NOTE: ${droppedCount} file(s) omitted — diff exceeded context budget.`);
    }

    sections.push(
        'Now generate a commit message that describes the CODE CHANGES above.\n' +
        'Do NOT copy from RECENT COMMITS — use them only as a style reference.\n' +
        'ALWAYS include a body with bullet points explaining what changed and why.\n' +
        'Output ONLY the commit message, no prose.'
    );

    return sections.join('\n\n');
}

// ---------------------------------------------------------------------------
// LLM helpers
// ---------------------------------------------------------------------------

async function httpRequest(
    url: string,
    method: 'GET' | 'POST',
    headers: Record<string, string>,
    body?: string
): Promise<string> {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const lib = parsedUrl.protocol === 'https:' ? https : http;
        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port ? parseInt(parsedUrl.port, 10) : (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method,
            headers,
        };
        const req = lib.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        if (body) {
            req.write(body);
        }
        req.end();
    });
}

async function resolveModel(baseUrl: string, modelArg: string | null): Promise<string> {
    if (modelArg) return modelArg;

    const resp = await httpRequest(`${baseUrl}/v1/models`, 'GET', {}).catch(() => '');
    try {
        const body = JSON.parse(resp);
        const models = body.data || [];
        if (!models.length) {
            throw new Error('No models available');
        }
        return models[0].id;
    } catch {
        throw new Error(`Could not fetch models from ${baseUrl}. Specify a model with --model.`);
    }
}

async function callLlm(
    userPrompt: string,
    baseUrl: string,
    model: string,
    apiKey: string | null,
    attempt = 0
): Promise<string> {
    const temperature = Math.min(0.3 * (1 + attempt), 2.0);

    const payload = {
        model,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
        ],
        temperature: Math.round(temperature * 100) / 100,
    };

    const body = JSON.stringify(payload);
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body).toString(),
    };
    if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const resp = await httpRequest(`${baseUrl}/v1/chat/completions`, 'POST', headers, body).catch(() => '');
    try {
        const parsed = JSON.parse(resp);
        return parsed.choices?.[0]?.message?.content?.trim() || '';
    } catch {
        throw new Error(`LLM call failed: ${resp}`);
    }
}

// ---------------------------------------------------------------------------
// Provider selection
// ---------------------------------------------------------------------------

interface ProviderQuickPick extends vscode.QuickPickItem {
    id: string;
}

async function selectProvider(): Promise<{ id: string; model: string | null } | null> {
    const items: ProviderQuickPick[] = Object.keys(PROVIDERS).map(id => ({
        label: id,
        description: PROVIDERS[id].baseUrl,
        id,
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select LLM provider',
    });

    if (!selected) return null;

    let model: string | null = null;
    const provider = PROVIDERS[selected.id];

    if (provider.defaultModel) {
        model = provider.defaultModel;
    } else {
        model = await vscode.window.showInputBox({
            prompt: `Enter model name for ${selected.id} (leave empty to auto-detect)`,
        }) || null;
    }

    return { id: selected.id, model };
}

// ---------------------------------------------------------------------------
// Main command
// ---------------------------------------------------------------------------

export async function registerGitCommitMessageAi(context: vscode.ExtensionContext): Promise<void> {
    const command = vscode.commands.registerCommand('dev-tools.gitCommitMessageAi', async () => {
        const workspaceRoot = await resolveWorkspaceRepoRoot();
        if (!workspaceRoot) {
            showError('No git repository found.');
            return;
        }

        // Check for staged changes
        const fileDiffs = await getStagedFileDiffs(workspaceRoot);
        if (!fileDiffs.length) {
            showError('No staged changes found. Stage your changes with `git add` first.');
            return;
        }

        // Select provider
        const providerSelection = await selectProvider();
        if (!providerSelection) return;

        const provider = PROVIDERS[providerSelection.id];
        const apiKey = provider.apiKeyEnv ? process.env[provider.apiKeyEnv] || null : null;

        if (provider.apiKeyEnv && !apiKey) {
            showError(`${provider.apiKeyEnv} environment variable is not set.`);
            return;
        }

        // Show progress
        await vscode.window.withProgress(
            { location: vscode.ProgressLocation.Notification, title: 'Generating commit message...' },
            async () => {
                try {
                    const model = await resolveModel(provider.baseUrl, providerSelection.model);
                    const repoName = await getRepoName(workspaceRoot);
                    const branchName = await getBranchName(workspaceRoot);
                    const userName = await execCommand('git config user.name', workspaceRoot).catch(() => '');
                    const userCommits = userName ? await getRecentCommits(workspaceRoot, userName) : [];
                    const repoCommits = await getRecentCommits(workspaceRoot);

                    const { included, dropped } = selectDiffsForBudget(fileDiffs, DIFF_TOKEN_BUDGET, ORIGINAL_TOKEN_BUDGET);
                    if (dropped > 0) {
                        showInfo(`${dropped} file(s) omitted from context (diff too large).`);
                    }

                    const userPrompt = buildUserPrompt(repoName, branchName, included, dropped, userCommits, repoCommits);
                    const message = await callLlm(userPrompt, provider.baseUrl, model, apiKey);

                    if (message) {
                        await vscode.env.clipboard.writeText(message);
                        showInfo('Commit message generated and copied to clipboard!');
                    } else {
                        showError('No response from LLM.');
                    }
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    showError(`Failed: ${msg}`);
                }
            }
        );
    });

    context.subscriptions.push(command);
}