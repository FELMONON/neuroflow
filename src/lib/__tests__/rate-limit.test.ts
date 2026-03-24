import { describe, it, expect, beforeEach, vi } from 'vitest';

// Force memory backend to avoid Supabase dependency
vi.stubEnv('RATE_LIMIT_BACKEND', 'memory');

// Must import after stubbing env
const { checkRateLimit, AUTH_RATE_LIMITS } = await import('../rate-limit');

describe('checkRateLimit (in-memory backend)', () => {
  // Use unique keys per test to avoid cross-test pollution
  let testKey: string;
  beforeEach(() => {
    testKey = `test-${Date.now()}-${Math.random()}`;
  });

  it('allows requests under the limit', async () => {
    const result = await checkRateLimit(testKey, { max: 5, windowMs: 60000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
    expect(result.retryAfterMs).toBe(0);
  });

  it('tracks remaining count correctly', async () => {
    const config = { max: 3, windowMs: 60000 };

    const r1 = await checkRateLimit(testKey, config);
    expect(r1.remaining).toBe(2);

    const r2 = await checkRateLimit(testKey, config);
    expect(r2.remaining).toBe(1);

    const r3 = await checkRateLimit(testKey, config);
    expect(r3.remaining).toBe(0);
  });

  it('blocks requests that exceed the limit', async () => {
    const config = { max: 2, windowMs: 60000 };

    await checkRateLimit(testKey, config);
    await checkRateLimit(testKey, config);
    const blocked = await checkRateLimit(testKey, config);

    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it('uses separate limits for different keys', async () => {
    const config = { max: 1, windowMs: 60000 };

    const r1 = await checkRateLimit(`${testKey}-a`, config);
    const r2 = await checkRateLimit(`${testKey}-b`, config);

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
  });

  it('provides a positive retryAfterMs when blocked', async () => {
    const config = { max: 1, windowMs: 10000 };
    await checkRateLimit(testKey, config);
    const blocked = await checkRateLimit(testKey, config);

    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(blocked.retryAfterMs).toBeLessThanOrEqual(10000);
  });
});

describe('AUTH_RATE_LIMITS presets', () => {
  it('login allows 5 requests per minute', () => {
    expect(AUTH_RATE_LIMITS.login.max).toBe(5);
    expect(AUTH_RATE_LIMITS.login.windowMs).toBe(60000);
  });

  it('signup allows 3 requests per minute', () => {
    expect(AUTH_RATE_LIMITS.signup.max).toBe(3);
    expect(AUTH_RATE_LIMITS.signup.windowMs).toBe(60000);
  });

  it('magic link allows 3 requests per 15 minutes', () => {
    expect(AUTH_RATE_LIMITS.magicLink.max).toBe(3);
    expect(AUTH_RATE_LIMITS.magicLink.windowMs).toBe(15 * 60 * 1000);
  });

  it('AI endpoints allow 20 requests per minute', () => {
    expect(AUTH_RATE_LIMITS.ai.max).toBe(20);
    expect(AUTH_RATE_LIMITS.ai.windowMs).toBe(60000);
  });
});
