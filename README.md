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
| `Dev Tools: Text - Minify` | Collapses all whitespace (newlines, tabs, repeated spaces) into a single line, displays result in new document |
| `Dev Tools: JIRA Activity` | Shows recent JIRA activity, collapses consecutive duplicate keys, copies selected keys to clipboard |

A toast notification confirms the content was copied to your clipboard.

## JIRA Activity

This command fetches recent activity from your JIRA instance and displays it in a multi-select picker.
Consecutive duplicate issue keys are collapsed to show only the latest entry in each run.

### Configuration

Set these in VS Code settings (or `settings.json`):

| Setting | Type | Default | Description |
|---|---|---|---|
| `dev-tools.jiraActivityUser` | string | *(required)* | JIRA username |
| `dev-tools.jiraActivityPassword` | string | *(required, sensitive)* | JIRA password |
| `dev-tools.jiraActivityBaseUrl` | string | *(required)* | Base URL for JIRA server (e.g., `http://jira.example.com:8080`) |
| `dev-tools.jiraActivityMaxResults` | number | `50` | Maximum number of activity entries to fetch |

### Usage

1. Set your JIRA username and password in settings (sensitive setting).
2. Optionally override the JIRA base URL if using a different server.
3. Run `Dev Tools: JIRA Activity` via the Command Palette.
4. A notification shows "Loading Jira activity..." while fetching data.
5. Select one or more JIRA keys in the picker.
6. Selected keys are copied to clipboard as a comma-separated list.

## Git Commit Message (AI)

This command calls an LLM to generate a commit message from your staged `git` changes.
It talks to any OpenAI-compatible chat completions API (`POST {baseUrl}/v1/chat/completions`), configured via the `dev-tools.gitCommitMessageAiEndpoints` setting.

### Configuration

Set `dev-tools.gitCommitMessageAiEndpoints` in `settings.json` to an array of endpoints:

```json
"dev-tools.gitCommitMessageAiEndpoints": [
  { "name": "LM Studio", "baseUrl": "http://127.0.0.1:1234" },
  { "name": "OpenRouter", "baseUrl": "https://openrouter.ai/api", "apiKey": "sk-or-...", "model": "openai/gpt-4o" }
]
```

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Display label shown when choosing between multiple endpoints |
| `baseUrl` | string | yes | OpenAI-compatible API base URL (the tool appends `/v1/...`) |
| `apiKey` | string | no | Sent as `Authorization: Bearer <apiKey>`. Omit for local endpoints that need no key. *(Sensitive)* |
| `model` | string | no | Model name. Omit to auto-detect the first model from `/v1/models` |

If exactly one endpoint is configured it's used automatically. If more than one is configured, a quick pick (name + base URL) is shown each run.

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
