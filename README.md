# VSCode Dev Tools

Developer productivity tools for VS Code: Markdown-to-JIRA conversion, Git commit URL picker, GitHub release creation, and JSON utilities

## Commands

Open the Command Palette (`Cmd+Shift+P`) and run:

| Command | Output |
|---|---|
| `Dev Tools: Export MD to JIRA (Cloud)` | Markdown (for JIRA Cloud) |
| `Dev Tools: Export MD to JIRA (Server)` | Wiki Markup (for JIRA Server / Confluence) |
| `Dev Tools: Git Release (Zip)` | Creates a GitHub release from a `.app` file |
| `Dev Tools: Git Commit Url (Copy)` | Shows recent commits in a picker, copies selected commit URL(s) to clipboard |
| `Dev Tools: Git Commit Message (AI)` | Generates a Conventional Commits message from staged changes using a local or remote LLM, copies result to clipboard |
| `Dev Tools: JSON - Parse` | Parses JSON (including double-encoded/stringified), displays prettified result in new document |
| `Dev Tools: JSON - Minify` | Minifies JSON to a single line, displays result in new document |
| `Dev Tools: JSON - Stringify` | Double-encodes JSON into a JSON string value, displays result in new document |

A toast notification confirms the content was copied to your clipboard.

## Git Commit Message (AI)

This command calls an LLM to generate a commit message from your staged `git` changes.
Select a provider when prompted; providers that require an API key read it from an environment variable.

| Provider | Environment variable | Notes |
|---|---|---|
| `lmstudio` | *(none)* | Local server, no key needed |
| `litellm` | `LITELLM_API_KEY` | Local proxy |
| `nim` | `NVIDIA_API_KEY` | NVIDIA Inference Microservices |
| `openrouter` | `OPENROUTER_API_KEY` | OpenRouter cloud API |

VS Code reads environment variables from the shell that launched it.
Set the variable **before** opening VS Code.

### macOS / Linux

Add the export to your shell profile (`~/.zshrc`, `~/.bashrc`, or `~/.bash_profile`), then restart your terminal and VS Code:

```bash
export OPENROUTER_API_KEY="sk-or-..."
```

To verify it is visible to VS Code, open the integrated terminal and run:

```bash
echo $OPENROUTER_API_KEY
```

### Windows

**Option A — System/User environment variables (persistent):**

1. Open **Start** → search **"Edit the system environment variables"**.
2. Click **Environment Variables…**
3. Under **User variables**, click **New** and enter the variable name and value.
4. Click **OK**, then restart VS Code.

**Option B — PowerShell (current session only):**

```powershell
$env:OPENROUTER_API_KEY = "sk-or-..."
code .
```

To verify it is visible after setting:

```powershell
$env:OPENROUTER_API_KEY
```

## What gets converted

| Element | Cloud output | Server output |
|---|---|---|
| Headings | `## Heading` | `h2. Heading` |
| Bold | `**bold**` | `*bold*` |
| Italic | `*italic*` | `_italic_` |
| Inline code | `` `code` `` | `{{code}}` |
| Code block | ` ```lang ` | `{code:lang}` |
| Unordered list | `- item` / `  - nested` | `* item` / `** nested` |
| Ordered list | `- item` (indented) | `# item` / `## nested` |
| Table | GFM table | `\|\| header \|\|` / `\| cell \|` |
| Link | `[text](https://example.com)` | `[text\|https://example.com]` |
| Image | `![alt](url)` | `!url!` |
| Blockquote | `> text` | `{quote}...{quote}` |
| Horizontal rule | `---` | `----` |

## Development

### Prerequisites

- Node.js 18+
- VS Code 1.85+

### Build

```bash
npm install
npm run build        # development build (with source maps)
```

### Run in Extension Development Host

Press `F5` in VS Code to launch a new window with the extension loaded.

## Packaging (`.vsix`)

### 1. Install `vsce`

```bash
npm install -g @vscode/vsce
```

### 2. Package

```bash
vsce package --allow-missing-repository
```

This runs `vscode:prepublish` (a minified production build) automatically, then produces:

```
vscode-md-to-jira-0.1.0.vsix
```

### 3. Install the `.vsix`

**Via terminal:**

```bash
code --install-extension vscode-md-to-jira-0.1.0.vsix
```

**Via UI:** Extensions sidebar → `···` menu → **Install from VSIX…**
