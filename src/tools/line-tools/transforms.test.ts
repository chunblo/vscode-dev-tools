import { describe, it, expect } from 'vitest';
import {
    sortLinesAsc,
    sortLinesDesc,
    sortLinesInsensitive,
    dedupeLines,
    trimLines,
    removeEmptyLines,
    reverseLines,
    lineOperations,
} from './transforms';

describe('sortLinesAsc', () => {
    it('sorts lines ascending', () => {
        expect(sortLinesAsc('banana\napple\ncherry')).toBe('apple\nbanana\ncherry');
    });

    it('handles CRLF input', () => {
        expect(sortLinesAsc('b\r\na\r\nc')).toBe('a\nb\nc');
    });

    it('handles empty lines', () => {
        expect(sortLinesAsc('b\n\na')).toBe('\na\nb');
    });
});

describe('sortLinesDesc', () => {
    it('sorts lines descending', () => {
        expect(sortLinesDesc('banana\napple\ncherry')).toBe('cherry\nbanana\napple');
    });

    it('handles CRLF input', () => {
        expect(sortLinesDesc('b\r\na\r\nc')).toBe('c\nb\na');
    });

    it('handles empty lines', () => {
        expect(sortLinesDesc('b\n\na')).toBe('b\na\n');
    });
});

describe('sortLinesInsensitive', () => {
    it('sorts case-insensitively', () => {
        expect(sortLinesInsensitive('banana\nApple\ncherry')).toBe('Apple\nbanana\ncherry');
    });

    it('handles CRLF input', () => {
        expect(sortLinesInsensitive('Zebra\r\napple\r\nMango')).toBe('apple\nMango\nZebra');
    });

    it('handles a single line', () => {
        expect(sortLinesInsensitive('only')).toBe('only');
    });
});

describe('dedupeLines', () => {
    it('removes duplicates keeping first occurrence', () => {
        expect(dedupeLines('a\nb\na\nc\nb')).toBe('a\nb\nc');
    });

    it('preserves original order', () => {
        expect(dedupeLines('c\na\nc\nb\na')).toBe('c\na\nb');
    });

    it('handles CRLF input', () => {
        expect(dedupeLines('a\r\nb\r\na')).toBe('a\nb');
    });

    it('keeps empty lines', () => {
        expect(dedupeLines('a\n\n\na')).toBe('a\n');
    });

    it('handles a single line', () => {
        expect(dedupeLines('only')).toBe('only');
    });
});

describe('trimLines', () => {
    it('trims each line', () => {
        expect(trimLines('  a  \n b \n c')).toBe('a\nb\nc');
    });

    it('handles CRLF input', () => {
        expect(trimLines('  a  \r\n\tb\t')).toBe('a\nb');
    });

    it('trims whitespace-only lines to empty', () => {
        expect(trimLines('  \n a ')).toBe('\na');
    });
});

describe('removeEmptyLines', () => {
    it('removes lines that are empty after trim', () => {
        expect(removeEmptyLines('a\n\n  \nb\n\t\nc')).toBe('a\nb\nc');
    });

    it('handles CRLF input', () => {
        expect(removeEmptyLines('a\r\n\r\nb')).toBe('a\nb');
    });

    it('returns empty string when all lines are empty', () => {
        expect(removeEmptyLines('\n  \n')).toBe('');
    });

    it('keeps non-empty lines unchanged', () => {
        expect(removeEmptyLines('a\nb')).toBe('a\nb');
    });
});

describe('reverseLines', () => {
    it('reverses line order', () => {
        expect(reverseLines('a\nb\nc')).toBe('c\nb\na');
    });

    it('handles CRLF input', () => {
        expect(reverseLines('a\r\nb\r\nc')).toBe('c\nb\na');
    });

    it('handles empty lines', () => {
        expect(reverseLines('a\n\nb')).toBe('b\n\na');
    });

    it('handles a single line', () => {
        expect(reverseLines('only')).toBe('only');
    });
});

describe('lineOperations', () => {
    it('exposes all expected labels', () => {
        expect(Object.keys(lineOperations)).toEqual([
            'Sort A→Z',
            'Sort Z→A',
            'Sort (case-insensitive)',
            'Remove Duplicates',
            'Trim Lines',
            'Remove Empty Lines',
            'Reverse',
        ]);
    });
});