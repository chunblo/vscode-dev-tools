/**
 * Encodes text for use in a URL (encodeURIComponent).
 */
export function urlEncode(content: string): string {
    return encodeURIComponent(content);
}

/**
 * Decodes URL-encoded text. Trims input and throws on malformed
 * percent-encoding.
 */
export function urlDecode(content: string): string {
    const s = content.trim();
    try {
        return decodeURIComponent(s);
    } catch {
        throw new Error('Invalid URL encoding');
    }
}