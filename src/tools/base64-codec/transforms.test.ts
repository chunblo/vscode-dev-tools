import { describe, it, expect } from 'vitest';
import { base64Encode, base64Decode } from './transforms';

describe('base64Encode', () => {
    it('encodes ASCII text', () => {
        expect(base64Encode('hello world')).toBe('aGVsbG8gd29ybGQ=');
    });

    it('encodes unicode text', () => {
        expect(base64Encode('héllo 世界')).toBe(Buffer.from('héllo 世界', 'utf8').toString('base64'));
    });

    it('round-trips with base64Decode', () => {
        const input = 'The quick brown fox jumps over the lazy dog. 你好';
        expect(base64Decode(base64Encode(input))).toBe(input);
    });
});

describe('base64Decode', () => {
    it('decodes valid base64', () => {
        expect(base64Decode('aGVsbG8gd29ybGQ=')).toBe('hello world');
    });

    it('decodes unicode base64', () => {
        const encoded = Buffer.from('héllo 世界', 'utf8').toString('base64');
        expect(base64Decode(encoded)).toBe('héllo 世界');
    });

    it('tolerates surrounding whitespace', () => {
        expect(base64Decode('  aGVsbG8gd29ybGQ=  ')).toBe('hello world');
    });

    it('tolerates missing padding', () => {
        expect(base64Decode('aGVsbG8gd29ybGQ')).toBe('hello world');
    });

    it('throws on invalid characters', () => {
        expect(() => base64Decode('aGVsbG8!!!')).toThrow('Invalid Base64');
    });

    it('throws on invalid UTF-8 bytes', () => {
        // base64 of bytes [0xFF, 0xFE] — not valid UTF-8
        expect(() => base64Decode('/v4=')).toThrow('Invalid Base64');
    });

    it('throws on excessive padding', () => {
        expect(() => base64Decode('====')).toThrow('Invalid Base64');
    });
});