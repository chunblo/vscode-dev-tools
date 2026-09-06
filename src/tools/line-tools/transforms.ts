/**
 * Splits content into lines, accepting both LF and CRLF line endings.
 */
function splitLines(content: string): string[] {
    return content.split(/\r?\n/);
}

export function sortLinesAsc(content: string): string {
    return splitLines(content).sort().join('\n');
}

export function sortLinesDesc(content: string): string {
    return splitLines(content).sort().reverse().join('\n');
}

export function sortLinesInsensitive(content: string): string {
    return splitLines(content)
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
        .join('\n');
}

export function dedupeLines(content: string): string {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const line of splitLines(content)) {
        if (!seen.has(line)) {
            seen.add(line);
            result.push(line);
        }
    }
    return result.join('\n');
}

export function trimLines(content: string): string {
    return splitLines(content)
        .map((line) => line.trim())
        .join('\n');
}

export function removeEmptyLines(content: string): string {
    return splitLines(content)
        .filter((line) => line.trim() !== '')
        .join('\n');
}

export function reverseLines(content: string): string {
    return splitLines(content).reverse().join('\n');
}

export const lineOperations: { [label: string]: (content: string) => string } = {
    'Sort A→Z': sortLinesAsc,
    'Sort Z→A': sortLinesDesc,
    'Sort (case-insensitive)': sortLinesInsensitive,
    'Remove Duplicates': dedupeLines,
    'Trim Lines': trimLines,
    'Remove Empty Lines': removeEmptyLines,
    'Reverse': reverseLines,
};