/**
 * Rate limiting with optional shared Supabase backend.
 *
 * - `RATE_LIMIT_BACKEND=supabase` forces shared backend (falls back to memory on runtime errors).
 * - `RATE_LIMIT_BACKEND=memory` forces in-memory backend.
 * - default `auto` uses Supabase when configured, otherwise memory.
 *
 * Supabase backend requires:
 * - `SUPABASE_SERVICE_ROLE_KEY`
 * - SQL function `public.check_rate_limit(...)` installed (see `supabase-rate-limit.sql`)
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

interface RateLimitEntry {
  timestamps: number[];
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

type RateLimitBackend = 'memory' | 'supabase' | 'auto';

const configuredBackend = (process.env.RATE_LIMIT_BACKEND ?? 'auto') as RateLimitBackend;
const BACKEND: RateLimitBackend =
  configuredBackend === 'memory' || configuredBackend === 'supabase' ? configuredBackend : 'auto';

let warnedSupabaseFallback = false;

// Memory backend (single instance only)
const store = new Map<string, RateLimitEntry>();
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

function checkRateLimitInMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  cleanup(config.windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => now - t < config.windowMs);

  if (entry.timestamps.length >= config.max) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = Math.max(0, config.windowMs - (now - oldestInWindow));
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: Math.max(0, config.max - entry.timestamps.length),
    retryAfterMs: 0,
  };
}

let _adminClient: ReturnType<typeof createClient<Database>> | null = null;

function hasSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function shouldUseSupabaseBackend(): boolean {
  if (BACKEND === 'memory') return false;
  if (BACKEND === 'supabase') return true;
  return hasSupabaseConfig();
}

function getAdminClient() {
  if (_adminClient) return _adminClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin env vars for shared rate limiting');
  }

  _adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _adminClient;
}

async function checkRateLimitInSupabase(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const admin = getAdminClient();
  const { data, error } = await admin.rpc('check_rate_limit', {
    p_key: key,
    p_max: config.max,
    p_window_ms: config.windowMs,
  });

  if (error) {
    throw new Error(`Supabase RPC failed: ${error.message}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (
    !row ||
    typeof row.allowed !== 'boolean' ||
    row.remaining === null ||
    row.retry_after_ms === null
  ) {
    throw new Error('Supabase RPC returned an invalid payload');
  }

  return {
    allowed: row.allowed,
    remaining: Number(row.remaining),
    retryAfterMs: Number(row.retry_after_ms),
  };
}

function warnSupabaseFallback(error: unknown) {
  if (warnedSupabaseFallback) return;
  warnedSupabaseFallback = true;
  console.warn(
    '[rate-limit] Falling back to memory backend. Check Supabase RPC setup.',
    error,
  );
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  if (shouldUseSupabaseBackend()) {
    try {
      return await checkRateLimitInSupabase(key, config);
    } catch (error) {
      warnSupabaseFallback(error);
      return checkRateLimitInMemory(key, config);
    }
  }

  return checkRateLimitInMemory(key, config);
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
