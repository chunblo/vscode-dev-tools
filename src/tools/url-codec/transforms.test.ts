import { describe, it, expect } from 'vitest';
import { urlEncode, urlDecode } from './transforms';

describe('urlEncode', () => {
    it('encodes special characters', () => {
        expect(urlEncode('a&b=c d')).toBe('a%26b%3Dc%20d');
    });

    it('encodes unicode', () => {
        expect(urlEncode('héllo 世界')).toBe('h%C3%A9llo%20%E4%B8%96%E7%95%8C');
    });

    it('leaves unreserved characters unchanged', () => {
        expect(urlEncode('abc-._~')).toBe('abc-._~');
    });
});

describe('urlDecode', () => {
    it('decodes encoded input', () => {
        expect(urlDecode('a%26b%3Dc%20d')).toBe('a&b=c d');
    });

    it('round-trips with urlEncode', () => {
        const input = 'a&b=c d héllo 世界?x=1';
        expect(urlDecode(urlEncode(input))).toBe(input);
    });

    it('tolerates surrounding whitespace', () => {
        expect(urlDecode('  a%26b  ')).toBe('a&b');
    });

    it('throws on malformed percent encoding', () => {
        expect(() => urlDecode('%zz')).toThrow('Invalid URL encoding');
    });

    it('throws on truncated percent encoding', () => {
        expect(() => urlDecode('%2')).toThrow('Invalid URL encoding');
    });
});