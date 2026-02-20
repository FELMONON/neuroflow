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
    const value = trimmed.slice(idx + 1).trim();
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

  console.log('Environment check passed: Supabase URL and keys look valid.');
}

main();
