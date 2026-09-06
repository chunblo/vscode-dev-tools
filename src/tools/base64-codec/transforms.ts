/**
 * Encodes text to Base64 (UTF-8).
 */
export function base64Encode(content: string): string {
    return Buffer.from(content, 'utf8').toString('base64');
}

/**
 * Decodes Base64 to UTF-8 text. Trims input, validates the character set
 * strictly, and round-trip checks the decoded bytes to reject garbage and
 * non-UTF-8 payloads.
 */
export function base64Decode(content: string): string {
    const s = content.trim();
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(s)) {
        throw new Error('Invalid Base64');
    }
    const decoded = Buffer.from(s, 'base64').toString('utf8');
    const reencoded = Buffer.from(decoded, 'utf8').toString('base64');
    if (reencoded.replace(/=+$/, '') !== s.replace(/=+$/, '')) {
        throw new Error('Invalid Base64');
    }
    return decoded;
}