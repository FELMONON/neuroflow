/**
 * Server-only Anthropic helpers shared by the AI API routes.
 *
 * - The client is created lazily so a missing ANTHROPIC_API_KEY degrades to a
 *   clear 503 from each route instead of crashing at module load.
 * - The model is configurable via ANTHROPIC_MODEL without a code change.
 */

import Anthropic from '@anthropic-ai/sdk';

export const AI_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250929';

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!client) client = new Anthropic({ apiKey });
  return client;
}

export function parseJsonFromResponse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
    if (match) {
      return JSON.parse(match[1].trim());
    }
    throw new Error('Could not parse JSON from response');
  }
}
