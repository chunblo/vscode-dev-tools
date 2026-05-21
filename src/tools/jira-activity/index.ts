import * as vscode from 'vscode';
import axios from 'axios';
import * as xml2js from 'xml2js';

const JIRA_KEY_RE = /[A-Z][A-Z0-9_]+-\d+/;
const HTML_TAG_RE = /<[^>]+>/g;

function stripHtml(text: string): string {
  let plain = text.replace(HTML_TAG_RE, '');
  plain = plain.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
  return plain.trim();
}

function atomText(node: unknown): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number' || typeof node === 'boolean') return String(node);
  if (node && typeof node === 'object' && '_' in (node as Record<string, unknown>)) {
    const textValue = (node as { _: unknown })._;
    return typeof textValue === 'string' ? textValue : String(textValue ?? '');
  }
  return '';
}

function extractJiraKey(href: string): string {
  const match = JIRA_KEY_RE.exec(href);
  return match ? match[0] : '';
}

function localize(raw: string): string {
  try {
    const dt = new Date(raw);
    // Format: YYYY-MM-DD HH:mm:ss +ZZZZ
    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = dt.getFullYear();
    const mm = pad(dt.getMonth() + 1);
    const dd = pad(dt.getDate());
    const hh = pad(dt.getHours());
    const min = pad(dt.getMinutes());
    const ss = pad(dt.getSeconds());
    const offset = -dt.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const absOffset = Math.abs(offset);
    const offsetH = pad(Math.floor(absOffset / 60));
    const offsetM = pad(absOffset % 60);
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss} ${sign}${offsetH}${offsetM}`;
  } catch {
    return raw;
  }
}

interface ActivityRecord {
  summary: string;
  key: string;
  link: string;
  timestamp: string;
}

function dedupeConsecutiveByKey(records: ActivityRecord[]): ActivityRecord[] {
  if (records.length <= 1) return records;
  const deduped: ActivityRecord[] = [];
  for (const record of records) {
    const prev = deduped[deduped.length - 1];
    if (!prev || prev.key !== record.key) {
      deduped.push(record);
    }
  }
  return deduped;
}

async function fetchFeed(baseUrl: string, username: string, password: string, maxResults: number): Promise<string> {
  const url = `${baseUrl}/activity?streams=user+IS+${encodeURIComponent(username)}&maxResults=${maxResults}`;
  const auth = username && password ? { username, password } : undefined;
  try {
    const response = await axios.get(url, { auth });
    return response.data;
  } catch (err: any) {
    throw new Error(err?.response?.status === 401 ? 'Authentication failed.' : err.message);
  }
}

async function parseFeed(xmlText: string): Promise<ActivityRecord[]> {
  const parser = new xml2js.Parser();
  const result = await parser.parseStringPromise(xmlText);
  const entries = result.feed.entry || [];
  return entries.map((entry: any) => {
    const rawTitle = atomText(entry.title?.[0]);
    const summary = stripHtml(rawTitle);
    let href = '';
    if (entry.link) {
      for (const link of entry.link) {
        const rel = atomText(link?.$?.rel);
        const candidateHref = atomText(link?.$?.href);
        if (rel === 'alternate') {
          href = candidateHref;
          break;
        }
        if (!href) href = candidateHref;
      }
    }
    const key = extractJiraKey(href);
    const timestampRaw = atomText(entry.published?.[0] ?? entry.updated?.[0] ?? '');
    return {
      summary,
      key,
      link: href,
      timestamp: localize(timestampRaw),
    };
  });
}

function _printTable(records: ActivityRecord[]): string {
  if (!records.length) return 'No activity found.';
  const headers = ['Activity Summary', 'Key', 'Timestamp'];
  let colSummary = Math.max(headers[0].length, ...records.map(r => r.summary.length));
  let colKey = Math.max(headers[1].length, ...records.map(r => r.key.length));
  let colTimestamp = Math.max(headers[2].length, ...records.map(r => r.timestamp.length));
  const MAX_SUMMARY = 80;
  if (colSummary > MAX_SUMMARY) colSummary = MAX_SUMMARY;
  const rowFmt = (summary: string, key: string, timestamp: string) =>
    `${summary.padEnd(colSummary)}  ${key.padEnd(colKey)}  ${timestamp.padEnd(colTimestamp)}`;
  const separator = '─'.repeat(colSummary + colKey + colTimestamp + 4);
  let out = rowFmt(...headers) + '\n' + separator + '\n';
  for (const r of records) {
    let summary = r.summary;
    if (summary.length > MAX_SUMMARY) summary = summary.slice(0, MAX_SUMMARY - 1) + '…';
    out += rowFmt(summary, r.key, r.timestamp) + '\n';
  }
  return out;
}

export async function jiraActivityCommand() {
  const config = vscode.workspace.getConfiguration();
  const username = config.get<string>('dev-tools.jiraActivityUser') || '';
  const password = config.get<string>('dev-tools.jiraActivityPassword') || '';
  const maxResults = config.get<number>('dev-tools.jiraActivityMaxResults') || 50;

  if (!username) {
    vscode.window.showErrorMessage('Jira username is required. Set dev-tools.jiraActivityUser in settings.');
    return;
  }

  const baseUrl = config.get<string>('dev-tools.jiraActivityBaseUrl') || '';

  if (!baseUrl) {
    vscode.window.showErrorMessage('Jira base URL is required. Set dev-tools.jiraActivityBaseUrl in settings.');
    return;
  }

  let records: ActivityRecord[];
  try {
    records = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Loading Jira activity...',
        cancellable: false,
      },
      async () => {
        const xmlText = await fetchFeed(baseUrl, username, password, maxResults);
        const parsed = await parseFeed(xmlText);
        return dedupeConsecutiveByKey(parsed);
      },
    );
  } catch (err: any) {
    const message = String(err?.message || 'Unknown error');
    if (message.toLowerCase().includes('parse')) {
      vscode.window.showErrorMessage(`Failed to parse Jira feed: ${message}`);
    } else {
      vscode.window.showErrorMessage(`Failed to fetch Jira activity: ${message}`);
    }
    return;
  }

  if (!records.length) {
    vscode.window.showInformationMessage('No activity found.');
    return;
  }

  const items: vscode.QuickPickItem[] = records
    .filter(r => r.key)
    .map(r => ({
    label: r.key,
    description: r.summary,
    detail: r.timestamp,
  }));

  if (!items.length) {
    vscode.window.showInformationMessage('No JIRA keys found in recent activity.');
    return;
  }

  const selected = await vscode.window.showQuickPick(items, {
    canPickMany: true,
    placeHolder: 'Select JIRA items (multi-select enabled)',
  });

  if (selected && selected.length > 0) {
    const keys = selected.map(item => item.label).join(', ');
    await vscode.env.clipboard.writeText(keys);
    vscode.window.showInformationMessage(`Copied ${selected.length} JIRA key(s) to clipboard.`);
  }
}
