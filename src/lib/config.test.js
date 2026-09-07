import { describe, it, expect } from 'vitest';
import { normalizeUrl, authHeaders } from './config';

describe('config.normalizeUrl', () => {
  it('falls back to localhost when unset', () => {
    expect(normalizeUrl(undefined)).toBe('http://localhost:5000');
    expect(normalizeUrl('')).toBe('http://localhost:5000');
  });
  it('strips trailing slashes and whitespace', () => {
    expect(normalizeUrl(' https://chat.example.com/// ')).toBe('https://chat.example.com');
  });
  it('rejects non-http(s) schemes', () => {
    expect(() => normalizeUrl('javascript:alert(1)')).toThrow();
    expect(() => normalizeUrl('ftp://x')).toThrow();
    expect(() => normalizeUrl('chat.example.com')).toThrow();
  });
});

describe('config.authHeaders', () => {
  it('omits Authorization when no token', () => {
    expect(authHeaders()).toEqual({ 'Content-Type': 'application/json' });
  });
  it('adds a Bearer token when present', () => {
    expect(authHeaders('abc').Authorization).toBe('Bearer abc');
  });
});
