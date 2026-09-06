import { describe, it, expect } from 'vitest';
import {
    splitWords,
    toCamel,
    toPascal,
    toSnake,
    toKebab,
    toConstant,
    toTitle,
    caseConverters,
} from './transforms';

describe('splitWords', () => {
    it('splits camelCase with acronyms and numbers', () => {
        expect(splitWords('getHTTPResponseCode2')).toEqual(['get', 'http', 'response', 'code', '2']);
    });

    it('splits mixed delimiters', () => {
        expect(splitWords('foo_bar-baz')).toEqual(['foo', 'bar', 'baz']);
    });

    it('splits PascalCase', () => {
        expect(splitWords('PascalCase')).toEqual(['pascal', 'case']);
    });

    it('splits SCREAMING_SNAKE', () => {
        expect(splitWords('SCREAMING_SNAKE')).toEqual(['screaming', 'snake']);
    });

    it('splits kebab-case', () => {
        expect(splitWords('kebab-case')).toEqual(['kebab', 'case']);
    });

    it('splits spaces, dots, and slashes', () => {
        expect(splitWords('hello world.foo/bar')).toEqual(['hello', 'world', 'foo', 'bar']);
    });

    it('splits acronym followed by lowercase word', () => {
        expect(splitWords('XMLHttpRequest')).toEqual(['xml', 'http', 'request']);
    });

    it('splits letters from numbers', () => {
        expect(splitWords('version2beta')).toEqual(['version', '2', 'beta']);
    });

    it('returns empty array for empty input', () => {
        expect(splitWords('')).toEqual([]);
    });

    it('returns empty array for delimiter-only input', () => {
        expect(splitWords('_- . /')).toEqual([]);
    });

    it('keeps a single word intact', () => {
        expect(splitWords('hello')).toEqual(['hello']);
    });
});

describe('toCamel', () => {
    it('converts snake_case', () => {
        expect(toCamel('foo_bar_baz')).toBe('fooBarBaz');
    });

    it('converts kebab-case', () => {
        expect(toCamel('foo-bar-baz')).toBe('fooBarBaz');
    });

    it('converts PascalCase', () => {
        expect(toCamel('FooBar')).toBe('fooBar');
    });

    it('converts mixed delimiters with numbers', () => {
        expect(toCamel('foo_bar-2')).toBe('fooBar2');
    });

    it('handles a single word', () => {
        expect(toCamel('hello')).toBe('hello');
    });

    it('handles empty string', () => {
        expect(toCamel('')).toBe('');
    });

    it('is idempotent on camelCase', () => {
        expect(toCamel('fooBarBaz')).toBe('fooBarBaz');
    });
});

describe('toPascal', () => {
    it('converts snake_case', () => {
        expect(toPascal('foo_bar')).toBe('FooBar');
    });

    it('converts camelCase', () => {
        expect(toPascal('fooBar')).toBe('FooBar');
    });

    it('converts kebab-case', () => {
        expect(toPascal('foo-bar-baz')).toBe('FooBarBaz');
    });

    it('handles a single word', () => {
        expect(toPascal('hello')).toBe('Hello');
    });

    it('handles empty string', () => {
        expect(toPascal('')).toBe('');
    });

    it('is idempotent on PascalCase', () => {
        expect(toPascal('FooBar')).toBe('FooBar');
    });
});

describe('toSnake', () => {
    it('converts camelCase', () => {
        expect(toSnake('fooBarBaz')).toBe('foo_bar_baz');
    });

    it('converts kebab-case', () => {
        expect(toSnake('foo-bar')).toBe('foo_bar');
    });

    it('converts PascalCase', () => {
        expect(toSnake('FooBar')).toBe('foo_bar');
    });

    it('converts mixed delimiters with numbers', () => {
        expect(toSnake('fooBar2')).toBe('foo_bar_2');
    });

    it('handles a single word', () => {
        expect(toSnake('hello')).toBe('hello');
    });

    it('handles empty string', () => {
        expect(toSnake('')).toBe('');
    });

    it('is idempotent on snake_case', () => {
        expect(toSnake('foo_bar')).toBe('foo_bar');
    });
});

describe('toKebab', () => {
    it('converts camelCase', () => {
        expect(toKebab('fooBarBaz')).toBe('foo-bar-baz');
    });

    it('converts snake_case', () => {
        expect(toKebab('foo_bar')).toBe('foo-bar');
    });

    it('converts PascalCase', () => {
        expect(toKebab('FooBar')).toBe('foo-bar');
    });

    it('handles a single word', () => {
        expect(toKebab('hello')).toBe('hello');
    });

    it('handles empty string', () => {
        expect(toKebab('')).toBe('');
    });

    it('is idempotent on kebab-case', () => {
        expect(toKebab('foo-bar')).toBe('foo-bar');
    });
});

describe('toConstant', () => {
    it('converts camelCase', () => {
        expect(toConstant('fooBarBaz')).toBe('FOO_BAR_BAZ');
    });

    it('converts kebab-case', () => {
        expect(toConstant('foo-bar')).toBe('FOO_BAR');
    });

    it('converts snake_case', () => {
        expect(toConstant('foo_bar')).toBe('FOO_BAR');
    });

    it('handles a single word', () => {
        expect(toConstant('hello')).toBe('HELLO');
    });

    it('handles empty string', () => {
        expect(toConstant('')).toBe('');
    });

    it('is idempotent on CONSTANT_CASE', () => {
        expect(toConstant('FOO_BAR')).toBe('FOO_BAR');
    });
});

describe('toTitle', () => {
    it('title-cases words', () => {
        expect(toTitle('hello world')).toBe('Hello World');
    });

    it('collapses multiple spaces', () => {
        expect(toTitle('hello   world')).toBe('Hello World');
    });

    it('trims leading and trailing whitespace', () => {
        expect(toTitle('  hello world  ')).toBe('Hello World');
    });

    it('keeps the rest of each word as-is', () => {
        expect(toTitle('hELLO wORLD')).toBe('HELLO WORLD');
    });

    it('handles a single word', () => {
        expect(toTitle('hello')).toBe('Hello');
    });

    it('handles empty string', () => {
        expect(toTitle('')).toBe('');
    });
});

describe('caseConverters', () => {
    it('exposes all expected labels', () => {
        expect(Object.keys(caseConverters)).toEqual([
            'camelCase',
            'PascalCase',
            'snake_case',
            'kebab-case',
            'CONSTANT_CASE',
            'Title Case',
        ]);
    });
});