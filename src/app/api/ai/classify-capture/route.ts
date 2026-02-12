import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/server';
import { checkRateLimit, AUTH_RATE_LIMITS } from '@/lib/rate-limit';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function parseJsonFromResponse(text: string): unknown {
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

interface CaptureClassification {
  type: 'task' | 'thought' | 'reminder';
  title?: string;
  due_date?: string;
  due_time?: string;
  original: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const rl = await checkRateLimit(`ai:${user.id}`, AUTH_RATE_LIMITS.ai);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    const { text } = body as Record<string, unknown>;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'text is required and must be a string' },
        { status: 400 }
      );
    }

    if ((text as string).length > 1000) {
      return NextResponse.json(
        { error: 'text must be 1000 characters or less' },
        { status: 400 }
      );
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 512,
      system: `Classify this quick capture into one of: task, thought, reminder. Also extract any dates or times mentioned. If it's a task, suggest a title. If it has a date/time, extract it.

Respond with JSON: { "type": "task"|"thought"|"reminder", "title": "string or null", "due_date": "YYYY-MM-DD or null", "due_time": "HH:MM or null", "original": "the original text" }

Return ONLY the JSON, no other text.`,
      messages: [{ role: 'user', content: (text as string).trim() }],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    const classification = parseJsonFromResponse(responseText) as CaptureClassification;

    if (!classification.type || !['task', 'thought', 'reminder'].includes(classification.type)) {
      return NextResponse.json(
        { error: 'AI returned unexpected format' },
        { status: 502 }
      );
    }

    // Ensure the original text is preserved
    classification.original = (text as string).trim();

    return NextResponse.json(classification);
  } catch (error: unknown) {
    console.error('classify-capture error:', error);

    if (error instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: 'AI service is temporarily unavailable. Please try again later.' },
        { status: 502 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Failed to parse AI response' },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
