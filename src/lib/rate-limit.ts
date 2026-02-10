/**
 * In-memory sliding-window rate limiter.
 * Good for single-instance deployments. For multi-instance, swap to Redis.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

interface RateLimitConfig {
  /** Max requests per window */
  max: number;
  /** Window size in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  cleanup(config.windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < config.windowMs);

  if (entry.timestamps.length >= config.max) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = config.windowMs - (now - oldestInWindow);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.max - entry.timestamps.length,
    retryAfterMs: 0,
  };
}

// Preset configurations
export const AUTH_RATE_LIMITS = {
  /** Password login: 5 attempts per minute per IP */
  login: { max: 5, windowMs: 60 * 1000 },
  /** Signup: 3 attempts per minute per IP */
  signup: { max: 3, windowMs: 60 * 1000 },
  /** Magic link: 3 per 15 minutes per email */
  magicLink: { max: 3, windowMs: 15 * 60 * 1000 },
  /** Password reset: 3 per 15 minutes per email */
  passwordReset: { max: 3, windowMs: 15 * 60 * 1000 },
  /** AI endpoints: 20 per minute per user */
  ai: { max: 20, windowMs: 60 * 1000 },
} as const;
