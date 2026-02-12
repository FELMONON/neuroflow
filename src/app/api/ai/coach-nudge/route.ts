import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/server';
import { COACH_SYSTEM_PROMPT } from '@/lib/ai';
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
    const {
      lastActivity,
      currentMood,
      currentEnergy,
      tasksCompleted,
      tasksRemaining,
    } = body as {
      lastActivity?: string;
      currentMood?: number;
      currentEnergy?: number;
      tasksCompleted?: number;
      tasksRemaining?: number;
    };

    if (lastActivity && (typeof lastActivity !== 'string' || lastActivity.length > 500)) {
      return NextResponse.json(
        { error: 'lastActivity must be a string of 500 characters or less' },
        { status: 400 }
      );
    }

    if (currentMood !== undefined && (typeof currentMood !== 'number' || currentMood < 1 || currentMood > 5)) {
      return NextResponse.json(
        { error: 'currentMood must be a number between 1 and 5' },
        { status: 400 }
      );
    }

    if (currentEnergy !== undefined && (typeof currentEnergy !== 'number' || currentEnergy < 1 || currentEnergy > 5)) {
      return NextResponse.json(
        { error: 'currentEnergy must be a number between 1 and 5' },
        { status: 400 }
      );
    }

    if (tasksCompleted !== undefined && (typeof tasksCompleted !== 'number' || tasksCompleted < 0 || !Number.isFinite(tasksCompleted))) {
      return NextResponse.json(
        { error: 'tasksCompleted must be a non-negative number' },
        { status: 400 }
      );
    }

    if (tasksRemaining !== undefined && (typeof tasksRemaining !== 'number' || tasksRemaining < 0 || !Number.isFinite(tasksRemaining))) {
      return NextResponse.json(
        { error: 'tasksRemaining must be a non-negative number' },
        { status: 400 }
      );
    }

    const contextParts: string[] = [];
    if (lastActivity) contextParts.push(`Last activity: ${lastActivity}`);
    if (currentMood !== undefined) contextParts.push(`Current mood: ${currentMood}/5`);
    if (currentEnergy !== undefined) contextParts.push(`Current energy: ${currentEnergy}/5`);
    if (tasksCompleted !== undefined) contextParts.push(`Tasks completed today: ${tasksCompleted}`);
    if (tasksRemaining !== undefined) contextParts.push(`Tasks remaining: ${tasksRemaining}`);

    const userMessage =
      contextParts.length > 0
        ? `Here's my current context:\n${contextParts.join('\n')}\n\nGive me a nudge.`
        : 'Give me a nudge to get started.';

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 512,
      system: `${COACH_SYSTEM_PROMPT}

Respond with JSON in this format:
{
  "message": "Your warm, encouraging coaching message",
  "suggestion": "Optional: a concrete suggestion or action",
  "action": "Optional: a specific action type like 'start_focus', 'take_break', 'body_double', 'dopamine_menu'"
}

Return ONLY the JSON, no other text.`,
      messages: [{ role: 'user', content: userMessage }],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    const nudge = parseJsonFromResponse(responseText) as {
      message: string;
      suggestion?: string;
      action?: string;
    };

    if (!nudge.message) {
      return NextResponse.json(
        { error: 'AI returned unexpected format' },
        { status: 502 }
      );
    }

    return NextResponse.json(nudge);
  } catch (error: unknown) {
    console.error('coach-nudge error:', error);

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
