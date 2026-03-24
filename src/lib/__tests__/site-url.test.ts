import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getSiteUrlOrThrow } from '../site-url';

describe('getSiteUrlOrThrow', () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    }
  });

  it('returns the origin for a valid HTTPS URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://myapp.vercel.app';
    expect(getSiteUrlOrThrow()).toBe('https://myapp.vercel.app');
  });

  it('allows localhost with HTTP', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000';
    expect(getSiteUrlOrThrow()).toBe('http://localhost:3000');
  });

  it('allows 127.0.0.1 with HTTP', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'http://127.0.0.1:3000';
    expect(getSiteUrlOrThrow()).toBe('http://127.0.0.1:3000');
  });

  it('throws when the env var is missing', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(() => getSiteUrlOrThrow()).toThrow('NEXT_PUBLIC_SITE_URL is required');
  });

  it('throws for an invalid URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'not-a-url';
    expect(() => getSiteUrlOrThrow()).toThrow('must be a valid absolute URL');
  });

  it('throws when URL includes a path', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com/app';
    expect(() => getSiteUrlOrThrow()).toThrow('must not include path, query, or hash');
  });

  it('throws when URL includes a query string', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com?foo=bar';
    expect(() => getSiteUrlOrThrow()).toThrow('must not include path, query, or hash');
  });

  it('throws when URL includes a hash', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com#section';
    expect(() => getSiteUrlOrThrow()).toThrow('must not include path, query, or hash');
  });

  it('throws for HTTP on a non-localhost domain', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'http://example.com';
    expect(() => getSiteUrlOrThrow()).toThrow('must use https (except localhost)');
  });

  it('strips trailing slash via URL origin normalization', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com/';
    // URL('https://example.com/').pathname is '/' which is allowed
    expect(getSiteUrlOrThrow()).toBe('https://example.com');
  });
});
