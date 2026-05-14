# MD to JIRA

A VS Code extension that converts the active file from Markdown to JIRA-compatible format and copies the result to the clipboard.

## Commands

Open the Command Palette (`Cmd+Shift+P`) and run:

| Command | Output |
|---|---|
| `Dev Tools: Export MD to JIRA (Cloud)` | Markdown (for JIRA Cloud) |
| `Dev Tools: Export MD to JIRA (Server)` | Wiki Markup (for JIRA Server / Confluence) |
| `Dev Tools: Git Release (Zip)` | Creates a GitHub release from a `.app` file |
| `Dev Tools: Git Commit Url (Copy)` | Shows recent commits in a picker, copies selected commit URL to clipboard |
| `Dev Tools: JSON - Parse` | Parses JSON (including double-encoded/stringified), displays prettified result in new document |
| `Dev Tools: JSON - Minify` | Minifies JSON to a single line, displays result in new document |
| `Dev Tools: JSON - Stringify` | Double-encodes JSON into a JSON string value, displays result in new document |

A toast notification confirms the content was copied to your clipboard.

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
