import { describe, it, expect } from 'vitest';
import { epochToIso, isoToEpoch, nowIso } from './transforms';

describe('epochToIso', () => {
    it('converts seconds to ISO 8601', () => {
        expect(epochToIso('1700000000')).toBe('2023-11-14T22:13:20.000Z');
    });

    it('converts milliseconds to ISO 8601', () => {
        expect(epochToIso('1700000000000')).toBe('2023-11-14T22:13:20.000Z');
    });

    it('tolerates surrounding whitespace', () => {
        expect(epochToIso('  1700000000  ')).toBe('2023-11-14T22:13:20.000Z');
    });

    it('throws on non-numeric input', () => {
        expect(() => epochToIso('abc')).toThrow('Invalid epoch timestamp');
    });

    it('throws on empty input', () => {
        expect(() => epochToIso('')).toThrow('Invalid epoch timestamp');
    });
});

describe('isoToEpoch', () => {
    it('converts ISO 8601 to epoch seconds', () => {
        expect(isoToEpoch('2023-11-14T22:13:20.000Z')).toBe('1700000000');
    });

    it('round-trips with epochToIso', () => {
        expect(isoToEpoch(epochToIso('1700000000'))).toBe('1700000000');
    });

    it('handles fractional seconds', () => {
        expect(isoToEpoch('2023-11-14T22:13:20.500Z')).toBe('1700000000');
    });

    it('throws on invalid date', () => {
        expect(() => isoToEpoch('not a date')).toThrow('Invalid date');
    });
});

describe('nowIso', () => {
    it('returns a valid ISO 8601 string', () => {
        const result = nowIso();
        expect(new Date(result).toISOString()).toBe(result);
    });
});