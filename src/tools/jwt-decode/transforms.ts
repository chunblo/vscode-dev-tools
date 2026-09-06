/**
 * Base64url-decodes a JWT segment (no padding required).
 */
function base64UrlDecode(part: string): string {
    const padded = part.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (part.length % 4)) % 4);
    return Buffer.from(padded, 'base64').toString('utf8');
}

/**
 * Finds the first JWT in the input (tolerating surrounding text) and returns
 * the pretty-printed header and payload JSON separated by a blank line.
 */
export function decodeJwt(input: string): string {
    const match = input.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/);
    if (!match) {
        throw new Error('Invalid JWT: cannot decode or parse token parts');
    }
    const parts = match[0].split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid JWT: cannot decode or parse token parts');
    }
    let header: unknown;
    let payload: unknown;
    try {
        header = JSON.parse(base64UrlDecode(parts[0]));
        payload = JSON.parse(base64UrlDecode(parts[1]));
    } catch {
        throw new Error('Invalid JWT: cannot decode or parse token parts');
    }
    return `${JSON.stringify(header, null, 2)}\n\n${JSON.stringify(payload, null, 2)}`;
}