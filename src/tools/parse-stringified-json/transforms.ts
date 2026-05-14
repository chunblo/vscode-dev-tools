/**
 * Parses a JSON string, handling double-encoded (stringified) JSON.
 * Returns prettified JSON.
 */
export function jsonParse(content: string): string {
    const first = JSON.parse(content);
    const parsed = typeof first === 'string' ? JSON.parse(first) : first;
    return JSON.stringify(parsed, null, 2);
}

/**
 * Minifies JSON to a single line.
 */
export function jsonMinify(content: string): string {
    return JSON.stringify(JSON.parse(content));
}

/**
 * Stringifies JSON into a double-encoded JSON string value.
 * e.g. {"a":1} → "{\"a\":1}"
 */
export function jsonStringify(content: string): string {
    return JSON.stringify(JSON.stringify(JSON.parse(content)));
}
