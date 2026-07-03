import dns from 'node:dns/promises';
import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const envLocalPath = path.join(cwd, '.env.local');
const envPath = path.join(cwd, '.env');

function parseEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;

  const raw = fs.readFileSync(filePath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    // Strip surrounding quotes (vercel env pull writes KEY="value")
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key && !(key in out)) out[key] = value;
  }
  return out;
}

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = Buffer.from(normalized, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function main() {
  const fileEnv = {
    ...parseEnvFile(envPath),
    ...parseEnvFile(envLocalPath),
  };

  const env = { ...fileEnv, ...process.env };

  const supabaseUrlRaw = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrlRaw) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL.');
    process.exit(1);
  }

  let supabaseUrl;
  try {
    supabaseUrl = new URL(supabaseUrlRaw);
  } catch {
    console.error('NEXT_PUBLIC_SUPABASE_URL is not a valid URL.');
    process.exit(1);
  }

  if (supabaseUrl.protocol !== 'https:') {
    console.error('NEXT_PUBLIC_SUPABASE_URL must use https.');
    process.exit(1);
  }

  const host = supabaseUrl.hostname;
  if (!host.endsWith('.supabase.co')) {
    console.error(`NEXT_PUBLIC_SUPABASE_URL host is not a Supabase host: ${host}`);
    process.exit(1);
  }

  try {
    await dns.lookup(host);
  } catch {
    console.error(`Supabase hostname does not resolve: ${host}`);
    console.error('This usually means the project URL is wrong or the project no longer exists.');
    process.exit(1);
  }

  if (!anonKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    process.exit(1);
  }

  const payload = decodeJwtPayload(anonKey);
  const hostRef = host.replace('.supabase.co', '');
  if (payload?.ref && payload.ref !== hostRef) {
    console.error(
      `Anon key project ref (${payload.ref}) does not match URL project ref (${hostRef}).`,
    );
    process.exit(1);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${supabaseUrl.origin}/auth/v1/health`, {
      headers: { apikey: anonKey },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`Supabase health check failed: HTTP ${res.status}`);
      process.exit(1);
    }
  } catch {
    console.error('Supabase health check failed (network/auth).');
    process.exit(1);
  }

  // Site URL — required for auth redirects (magic links, password reset, OAuth).
  const siteUrl = env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    console.error('Missing NEXT_PUBLIC_SITE_URL (required for auth redirects).');
    process.exit(1);
  }
  try {
    const parsed = new URL(siteUrl);
    const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !isLocalhost) {
      console.error('NEXT_PUBLIC_SITE_URL must use https (except localhost).');
      process.exit(1);
    }
    if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
      console.error('NEXT_PUBLIC_SITE_URL must be a bare origin (no path/query/hash).');
      process.exit(1);
    }
  } catch {
    console.error('NEXT_PUBLIC_SITE_URL is not a valid URL.');
    process.exit(1);
  }

  // Anthropic — required for all AI features.
  if (!env.ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY (AI routes will return 503).');
    process.exit(1);
  }

  // Service role — required for account deletion and shared rate limiting.
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      'Warning: SUPABASE_SERVICE_ROLE_KEY is not set. Account deletion will fail and rate limiting falls back to per-instance memory.',
    );
  }

  console.log('Environment check passed: Supabase URL and keys look valid.');
}

main();
