const SITE_URL_ENV_KEY = 'NEXT_PUBLIC_SITE_URL';
const LOCALHOST_HOSTNAMES = new Set(['localhost', '127.0.0.1', '::1']);

/**
 * Returns the canonical site origin for auth redirects.
 * Fails closed if the environment variable is missing or unsafe.
 */
export function getSiteUrlOrThrow(): string {
  const raw = process.env[SITE_URL_ENV_KEY];
  if (!raw) {
    throw new Error(`${SITE_URL_ENV_KEY} is required`);
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`${SITE_URL_ENV_KEY} must be a valid absolute URL`);
  }

  if (parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error(`${SITE_URL_ENV_KEY} must not include path, query, or hash`);
  }

  const isHttps = parsed.protocol === 'https:';
  const isLocalhost = LOCALHOST_HOSTNAMES.has(parsed.hostname);

  if (!isHttps && !isLocalhost) {
    throw new Error(`${SITE_URL_ENV_KEY} must use https (except localhost)`);
  }

  return parsed.origin;
}
