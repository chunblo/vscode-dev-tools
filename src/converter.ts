import { marked, Token, Tokens } from 'marked';

export function convertToJira(text: string, mode: 'cloud' | 'server'): string {
    const tokens = marked.lexer(text);
    return renderTokenList(tokens as Token[], mode, 0);
}

function renderTokenList(tokens: Token[], mode: 'cloud' | 'server', listDepth: number): string {
    return tokens.map(t => renderToken(t, mode, listDepth)).join('');
}

function renderToken(token: Token, mode: 'cloud' | 'server', listDepth: number): string {
    switch (token.type) {
        case 'heading':    return renderHeading(token as Tokens.Heading, mode);
        case 'paragraph':  return renderParagraph(token as Tokens.Paragraph, mode);
        case 'code':       return renderCode(token as Tokens.Code, mode);
        case 'list':       return renderList(token as Tokens.List, mode, listDepth);
        case 'hr':         return mode === 'cloud' ? '---\n\n' : '----\n\n';
        case 'space':      return '';
        case 'blockquote': return renderBlockquote(token as Tokens.Blockquote, mode);
        case 'table':      return renderTable(token as Tokens.Table, mode);
        case 'html':       return '';
        // Inline tokens
        case 'text':       return renderText(token as Tokens.Text, mode);
        case 'strong':     return renderStrong(token as Tokens.Strong, mode);
        case 'em':         return renderEm(token as Tokens.Em, mode);
        case 'codespan':   return renderCodespan(token as Tokens.Codespan, mode);
        case 'link':       return renderLink(token as Tokens.Link, mode);
        case 'image':      return renderImage(token as Tokens.Image, mode);
        case 'br':         return '\n';
        case 'del':        return renderInlineTokens((token as Tokens.Del).tokens, mode);
        case 'escape':     return (token as Tokens.Escape).text;
        default:           return '';
    }
}

// ── Block renderers ───────────────────────────────────────────────────────────

function renderHeading(token: Tokens.Heading, mode: 'cloud' | 'server'): string {
    const text = renderInlineTokens(token.tokens, mode);
    return mode === 'cloud'
        ? `${'#'.repeat(token.depth)} ${text}\n\n`
        : `h${token.depth}. ${text}\n\n`;
}

function renderParagraph(token: Tokens.Paragraph, mode: 'cloud' | 'server'): string {
    return renderInlineTokens(token.tokens, mode).trimEnd() + '\n\n';
}

function renderCode(token: Tokens.Code, mode: 'cloud' | 'server'): string {
    const code = token.text.trimEnd();
    const lang = token.lang ?? '';
    return mode === 'cloud'
        ? (lang ? `\`\`\`${lang}\n${code}\n\`\`\`\n\n` : `\`\`\`\n${code}\n\`\`\`\n\n`)
        : (lang ? `{code:${lang}}\n${code}\n{code}\n\n` : `{code}\n${code}\n{code}\n\n`);
}

function renderBlockquote(token: Tokens.Blockquote, mode: 'cloud' | 'server'): string {
    const inner = renderTokenList(token.tokens, mode, 0).trimEnd();
    return mode === 'cloud'
        ? inner.split('\n').map(l => `> ${l}`).join('\n') + '\n\n'
        : `{quote}\n${inner}\n{quote}\n\n`;
}

function renderList(token: Tokens.List, mode: 'cloud' | 'server', listDepth: number): string {
    const depth = listDepth + 1;
    const result = token.items.map(item => renderListItem(item, mode, depth, token.ordered)).join('');
    // Only add a blank line after top-level lists (depth 0 → 1) to match block spacing
    return depth === 1 ? result + '\n' : result;
}

function renderListItem(
    item: Tokens.ListItem,
    mode: 'cloud' | 'server',
    depth: number,
    ordered: boolean,
): string {
    const prefix = getListPrefix(mode, depth, ordered);
    let content = '';
    let nested = '';

    for (const tok of item.tokens) {
        if (tok.type === 'list') {
            nested += renderList(tok as Tokens.List, mode, depth);
        } else if (tok.type === 'paragraph') {
            content += renderInlineTokens((tok as Tokens.Paragraph).tokens, mode);
        } else if (tok.type === 'text') {
            const t = tok as Tokens.Text;
            content += t.tokens ? renderInlineTokens(t.tokens, mode) : t.text;
        } else {
            content += renderToken(tok, mode, depth);
        }
    }

    let itemContent = content.trim();
    // Preserve GFM task-list checkboxes in Cloud (Markdown) mode
    if (item.task && mode === 'cloud') {
        itemContent = (item.checked ? '[x] ' : '[ ] ') + itemContent;
    }

    return prefix + itemContent + '\n' + nested;
}

function getListPrefix(mode: 'cloud' | 'server', depth: number, ordered: boolean): string {
    if (mode === 'cloud') {
        return '  '.repeat(depth - 1) + '- ';
    }
    return (ordered ? '#' : '*').repeat(depth) + ' ';
}

function renderTable(token: Tokens.Table, mode: 'cloud' | 'server'): string {
    if (mode === 'cloud') {
        const headers = token.header.map(c => renderInlineTokens(c.tokens, mode)).join(' | ');
        const sep = token.header.map(() => '---').join(' | ');
        const rows = token.rows.map(
            row => '| ' + row.map(c => renderInlineTokens(c.tokens, mode)).join(' | ') + ' |',
        );
        return `| ${headers} |\n| ${sep} |\n${rows.join('\n')}\n\n`;
    }
    // JIRA Server wiki table: || header || and | cell |
    const header = '|| ' + token.header.map(c => renderInlineTokens(c.tokens, mode)).join(' || ') + ' ||';
    const rows = token.rows.map(
        row => '| ' + row.map(c => renderInlineTokens(c.tokens, mode)).join(' | ') + ' |',
    );
    return [header, ...rows].join('\n') + '\n\n';
}

// ── Inline renderers ──────────────────────────────────────────────────────────

function renderInlineTokens(tokens: Token[], mode: 'cloud' | 'server'): string {
    return tokens.map(t => renderToken(t, mode, 0)).join('');
}

function renderText(token: Tokens.Text, mode: 'cloud' | 'server'): string {
    return token.tokens ? renderInlineTokens(token.tokens, mode) : token.text;
}

function renderStrong(token: Tokens.Strong, mode: 'cloud' | 'server'): string {
    const inner = renderInlineTokens(token.tokens, mode);
    return mode === 'cloud' ? `**${inner}**` : `*${inner}*`;
}

function renderEm(token: Tokens.Em, mode: 'cloud' | 'server'): string {
    const inner = renderInlineTokens(token.tokens, mode);
    return mode === 'cloud' ? `*${inner}*` : `_${inner}_`;
}

function renderCodespan(token: Tokens.Codespan, mode: 'cloud' | 'server'): string {
    return mode === 'cloud' ? `\`${token.text}\`` : `{{${token.text}}}`;
}

function renderLink(token: Tokens.Link, mode: 'cloud' | 'server'): string {
    const text = renderInlineTokens(token.tokens, mode);
    if (mode === 'cloud') {
        return token.title
            ? `[${text}](${token.href} "${token.title}")`
            : `[${text}](${token.href})`;
    }
    return `[${text}|${token.href}]`;
}

function renderImage(token: Tokens.Image, mode: 'cloud' | 'server'): string {
    if (mode === 'cloud') {
        return token.title
            ? `![${token.text}](${token.href} "${token.title}")`
            : `![${token.text}](${token.href})`;
    }
    // JIRA Server wiki markup: !url! or !url|thumbnail!
    return `!${token.href}!`;
}
