import { describe, it, expect } from 'vitest';
import { textMinify } from './transforms';

describe('textMinify', () => {
    it('collapses newlines into a single space', () => {
        expect(textMinify('line one\nline two')).toBe('line one line two');
    });

    it('collapses tabs and repeated spaces', () => {
        expect(textMinify('a\t\tb   c')).toBe('a b c');
    });

    it('trims leading and trailing whitespace', () => {
        expect(textMinify('  hello world  ')).toBe('hello world');
    });

    it('returns empty string for empty input', () => {
        expect(textMinify('')).toBe('');
    });

    it('returns empty string for whitespace-only input', () => {
        expect(textMinify(' \t\n ')).toBe('');
    });

    it('leaves already-single-line text unchanged', () => {
        expect(textMinify('already single line')).toBe('already single line');
    });

    it('preserves internal sentence text', () => {
        const input = 'The quick brown fox\njumps over\tthe lazy dog.';
        expect(textMinify(input)).toBe('The quick brown fox jumps over the lazy dog.');
    });
});