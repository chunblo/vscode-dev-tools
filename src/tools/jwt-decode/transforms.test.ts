import { describe, it, expect } from 'vitest';
import { decodeJwt } from './transforms';

function base64UrlEncode(obj: unknown): string {
    return Buffer.from(JSON.stringify(obj), 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function buildJwt(header: unknown, payload: unknown, signature = 'signature'): string {
    return `${base64UrlEncode(header)}.${base64UrlEncode(payload)}.${signature}`;
}

describe('decodeJwt', () => {
    it('decodes a valid token into header and payload', () => {
        const header = { alg: 'HS256', typ: 'JWT' };
        const payload = { sub: '1234567890', name: 'John Doe', exp: 1700000000 };
        const token = buildJwt(header, payload);
        const result = decodeJwt(token);
        expect(result).toBe(`${JSON.stringify(header, null, 2)}\n\n${JSON.stringify(payload, null, 2)}`);
    });

    it('tolerates surrounding text', () => {
        const token = buildJwt({ alg: 'HS256' }, { sub: '123' });
        const result = decodeJwt(`Authorization: Bearer ${token}`);
        expect(result).toContain('"sub": "123"');
    });

    it('throws when no JWT is present', () => {
        expect(() => decodeJwt('no token here')).toThrow('Invalid JWT: cannot decode or parse token parts');
    });

    it('throws on corrupted payload', () => {
        const [header, , signature] = buildJwt({ alg: 'HS256' }, { sub: '123' }).split('.');
        const corruptedPayload = Buffer.from('not json', 'utf8').toString('base64').replace(/=+$/, '');
        expect(() => decodeJwt(`${header}.${corruptedPayload}.${signature}`)).toThrow(
            'Invalid JWT: cannot decode or parse token parts',
        );
    });
});