/**
 * Minifies text to a single line by collapsing all whitespace
 * (newlines, tabs, repeated spaces) into single spaces and trimming.
 */
export function textMinify(content: string): string {
    return content.replace(/\s+/g, ' ').trim();
}