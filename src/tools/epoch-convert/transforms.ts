/**
 * Converts an epoch timestamp (seconds or milliseconds) to ISO 8601.
 * Values below 10^11 are treated as seconds, otherwise as milliseconds.
 */
export function epochToIso(input: string): string {
    const s = input.trim();
    if (!/^\d+$/.test(s)) {
        throw new Error('Invalid epoch timestamp');
    }
    const value = Number(s);
    const ms = value < 1e11 ? value * 1000 : value;
    const date = new Date(ms);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid epoch timestamp');
    }
    return date.toISOString();
}

/**
 * Converts an ISO 8601 date string to epoch seconds.
 */
export function isoToEpoch(input: string): string {
    const s = input.trim();
    const ms = Date.parse(s);
    if (isNaN(ms)) {
        throw new Error('Invalid date');
    }
    return String(Math.floor(ms / 1000));
}

/**
 * Returns the current time as an ISO 8601 string.
 */
export function nowIso(): string {
    return new Date().toISOString();
}