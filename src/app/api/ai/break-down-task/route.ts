import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient, parseJsonFromResponse, AI_MODEL } from '@/lib/anthropic';
import { createServerClient } from '@/lib/supabase/server';
import { checkRateLimit, AUTH_RATE_LIMITS } from '@/lib/rate-limit';

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

    const anthropic = getAnthropicClient();
    if (!anthropic) {
      console.error('ANTHROPIC_API_KEY is not configured');
      return NextResponse.json(
        { error: 'AI features are not configured on this server.' },
        { status: 503 },
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
      model: AI_MODEL,
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
