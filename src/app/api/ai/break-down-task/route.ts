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
    const { title, description } = body as Record<string, unknown>;

    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'title is required and must be a string' },
        { status: 400 }
      );
    }

    if ((title as string).length > 500) {
      return NextResponse.json(
        { error: 'title must be 500 characters or less' },
        { status: 400 }
      );
    }

    if (description !== undefined && (typeof description !== 'string' || description.length > 2000)) {
      return NextResponse.json(
        { error: 'description must be a string of 2000 characters or less' },
        { status: 400 }
      );
    }

    const safeTitle = (title as string).trim();
    const safeDescription = typeof description === 'string' ? description.trim() : undefined;
    const userMessage = `Task: ${safeTitle}${safeDescription ? `\nContext: ${safeDescription}` : ''}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: `You are an ADHD-specialized task coach. Break down the following task into concrete, physical next actions. Each subtask should: 1. Start with a verb (Open, Write, Click, Call, Walk to...) 2. Be completable in under 30 minutes 3. Be specific enough that the person knows EXACTLY what to do without thinking 4. Not require any further breakdown

Respond with a JSON array of objects, each with: { "title": string, "estimated_minutes": number, "energy_required": "high" | "medium" | "low" }. Return ONLY the JSON array, no other text.`,
      messages: [{ role: 'user', content: userMessage }],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    const subtasks = parseJsonFromResponse(responseText);

    if (!Array.isArray(subtasks)) {
      return NextResponse.json(
        { error: 'AI returned unexpected format' },
        { status: 502 }
      );
    }

    return NextResponse.json({ subtasks });
  } catch (error: unknown) {
    console.error('break-down-task error:', error);

    // Anthropic SDK errors (rate limit, auth, etc.)
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
