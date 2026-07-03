/**
 * Shared input validators usable on both server and client.
 */

// Pragmatic email check: one @, no spaces, a dot in the domain, sane length.
// Supabase does authoritative validation; this rejects junk before it hits auth.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

export function isValidEmail(email: string): boolean {
  return email.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(email);
}
