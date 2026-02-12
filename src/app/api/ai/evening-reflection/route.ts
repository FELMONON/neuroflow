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

interface ReflectionResponse {
  summary: string;
  encouragement: string;
  tomorrowTip: string;
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
    const { wins, struggles, tasksCompleted, focusMinutes } = body as {
      wins: string[];
      struggles: string[];
      tasksCompleted?: number;
      focusMinutes?: number;
    };

    if (!wins || !Array.isArray(wins)) {
      return NextResponse.json(
        { error: 'wins array is required' },
        { status: 400 }
      );
    }

    if (wins.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 wins allowed' },
        { status: 400 }
      );
    }

    if (!struggles || !Array.isArray(struggles)) {
      return NextResponse.json(
        { error: 'struggles array is required' },
        { status: 400 }
      );
    }

    if (struggles.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 struggles allowed' },
        { status: 400 }
      );
    }

    // Validate array elements are strings with length limits
    for (const w of wins) {
      if (typeof w !== 'string' || w.length > 500) {
        return NextResponse.json(
          { error: 'Each win must be a string of 500 characters or less' },
          { status: 400 }
        );
      }
    }

    for (const s of struggles) {
      if (typeof s !== 'string' || s.length > 500) {
        return NextResponse.json(
          { error: 'Each struggle must be a string of 500 characters or less' },
          { status: 400 }
        );
      }
    }

    if (tasksCompleted !== undefined && (typeof tasksCompleted !== 'number' || tasksCompleted < 0 || !Number.isFinite(tasksCompleted))) {
      return NextResponse.json(
        { error: 'tasksCompleted must be a non-negative number' },
        { status: 400 }
      );
    }

    if (focusMinutes !== undefined && (typeof focusMinutes !== 'number' || focusMinutes < 0 || !Number.isFinite(focusMinutes))) {
      return NextResponse.json(
        { error: 'focusMinutes must be a non-negative number' },
        { status: 400 }
      );
    }

    const contextParts: string[] = [];
    if (wins.length > 0) contextParts.push(`Wins today:\n${wins.map((w) => `- ${w}`).join('\n')}`);
    if (struggles.length > 0)
      contextParts.push(`Struggles today:\n${struggles.map((s) => `- ${s}`).join('\n')}`);
    if (tasksCompleted !== undefined)
      contextParts.push(`Tasks completed: ${tasksCompleted}`);
    if (focusMinutes !== undefined)
      contextParts.push(`Total focus time: ${focusMinutes} minutes`);

    const userMessage = contextParts.join('\n\n');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: `You are NeuroFlow's evening reflection companion. Generate a warm, encouraging reflection summary. Celebrate wins genuinely. Normalize struggles. Suggest one small thing for tomorrow. Never guilt or shame. Keep it to 3-4 sentences.

Respond with JSON in this format:
{
  "summary": "A warm summary of the day (2-3 sentences)",
  "encouragement": "Genuine encouragement about their wins and normalizing struggles (1-2 sentences)",
  "tomorrowTip": "One small, concrete suggestion for tomorrow (1 sentence)"
}

Return ONLY the JSON, no other text.`,
      messages: [{ role: 'user', content: userMessage }],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    const reflection = parseJsonFromResponse(responseText) as ReflectionResponse;

    if (!reflection.summary || !reflection.encouragement || !reflection.tomorrowTip) {
      return NextResponse.json(
        { error: 'AI returned unexpected format' },
        { status: 502 }
      );
    }

    return NextResponse.json(reflection);
  } catch (error: unknown) {
    console.error('evening-reflection error:', error);

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
