import { describe, it, expect } from 'vitest';
import { jsonParse, jsonMinify, jsonStringify } from './transforms';

describe('jsonParse', () => {
    it('prettifies minified JSON', () => {
        const input = '{"a":1,"b":"hello"}';
        expect(jsonParse(input)).toBe(JSON.stringify({ a: 1, b: 'hello' }, null, 2));
    });

    it('parses double-encoded (stringified) JSON', () => {
        const inner = { a: 1, b: 'hello' };
        const input = JSON.stringify(JSON.stringify(inner));
        expect(jsonParse(input)).toBe(JSON.stringify(inner, null, 2));
    });

    it('handles nested objects and arrays', () => {
        const obj = { x: [1, 2, 3], y: { z: true } };
        const input = JSON.stringify(obj);
        expect(jsonParse(input)).toBe(JSON.stringify(obj, null, 2));
    });

    it('throws on invalid JSON', () => {
        expect(() => jsonParse('not json')).toThrow();
    });
});

describe('jsonMinify', () => {
    it('collapses prettified JSON to one line', () => {
        const obj = { a: 1, b: 'hello' };
        const input = JSON.stringify(obj, null, 2);
        expect(jsonMinify(input)).toBe('{"a":1,"b":"hello"}');
    });

    it('is idempotent on already-minified JSON', () => {
        const input = '{"a":1}';
        expect(jsonMinify(input)).toBe('{"a":1}');
    });

    it('throws on invalid JSON', () => {
        expect(() => jsonMinify('not json')).toThrow();
    });
});

describe('jsonStringify', () => {
    it('stringifies JSON into a double-encoded string', () => {
        const input = '{"a":1}';
        const result = jsonStringify(input);
        // The result must itself be valid JSON whose value is the minified original
        expect(JSON.parse(result)).toBe('{"a":1}');
    });

    it('minifies before stringifying', () => {
        const input = JSON.stringify({ a: 1 }, null, 2);
        const result = jsonStringify(input);
        expect(JSON.parse(result)).toBe('{"a":1}');
    });

    it('round-trips with jsonParse', () => {
        const original = { a: 1, b: 'hello' };
        const stringified = jsonStringify(JSON.stringify(original));
        const reparsed = jsonParse(stringified);
        expect(reparsed).toBe(JSON.stringify(original, null, 2));
    });

    it('throws on invalid JSON', () => {
        expect(() => jsonStringify('not json')).toThrow();
    });
});
