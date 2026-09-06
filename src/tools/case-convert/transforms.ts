/**
 * Tokenizes arbitrary input into lowercase words, handling camelCase,
 * PascalCase, snake_case, SCREAMING_SNAKE, kebab-case, spaces, dots,
 * and slashes. Non-alphanumeric characters act as separators and are dropped.
 */
export function splitWords(input: string): string[] {
    return input
        .replace(/[^a-zA-Z0-9]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/([a-zA-Z])([0-9])/g, '$1 $2')
        .replace(/([0-9])([a-zA-Z])/g, '$1 $2')
        .split(/\s+/)
        .filter((word) => word.length > 0)
        .map((word) => word.toLowerCase());
}

function titleCase(word: string): string {
    return word.charAt(0).toUpperCase() + word.slice(1);
}

export function toCamel(input: string): string {
    const words = splitWords(input);
    if (words.length === 0) {
        return '';
    }
    return words[0] + words.slice(1).map(titleCase).join('');
}

export function toPascal(input: string): string {
    return splitWords(input).map(titleCase).join('');
}

export function toSnake(input: string): string {
    return splitWords(input).join('_');
}

export function toKebab(input: string): string {
    return splitWords(input).join('-');
}

export function toConstant(input: string): string {
    return splitWords(input).join('_').toUpperCase();
}

/**
 * Title-cases words: splits on whitespace, capitalizes the first letter of
 * each word, keeps the rest as-is, and collapses multiple spaces.
 */
export function toTitle(input: string): string {
    return input
        .trim()
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export const caseConverters: { [label: string]: (input: string) => string } = {
    'camelCase': toCamel,
    'PascalCase': toPascal,
    'snake_case': toSnake,
    'kebab-case': toKebab,
    'CONSTANT_CASE': toConstant,
    'Title Case': toTitle,
};