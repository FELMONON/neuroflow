import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/server';
import { checkRateLimit, AUTH_RATE_LIMITS } from '@/lib/rate-limit';
import type { Task, TimeBlock } from '@/types/database';

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

interface MorningPlanResponse {
  greeting: string;
  mainFocus: string;
  timeBlocks: TimeBlock[];
  suggestion: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const rl = checkRateLimit(`ai:${user.id}`, AUTH_RATE_LIMITS.ai);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
      );
    }

    const body = await request.json();
    const { tasks, energyPattern, timezone } = body as {
      tasks: Task[];
      energyPattern: {
        peak_start: string;
        peak_end: string;
        dip_start: string;
        dip_end: string;
      };
      timezone?: string;
    };

    if (!tasks || !Array.isArray(tasks)) {
      return NextResponse.json(
        { error: 'tasks array is required' },
        { status: 400 }
      );
    }

    if (tasks.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 tasks allowed' },
        { status: 400 }
      );
    }

    if (!energyPattern) {
      return NextResponse.json(
        { error: 'energyPattern is required' },
        { status: 400 }
      );
    }

    const taskSummary = tasks
      .map(
        (t) =>
          `- "${t.title}" (priority: ${t.priority}, energy: ${t.energy_required}, est: ${t.estimated_minutes ?? '?'}min)`
      )
      .join('\n');

    const userMessage = `Tasks for today:\n${taskSummary}\n\nEnergy Pattern:\n- Peak hours: ${energyPattern.peak_start} to ${energyPattern.peak_end}\n- Dip hours: ${energyPattern.dip_start} to ${energyPattern.dip_end}\n${timezone ? `- Timezone: ${timezone}` : ''}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: `You are NeuroFlow's AI morning planner. Given the user's tasks and energy pattern, create an optimized daily plan. Match high-energy tasks to peak hours and low-energy tasks to dip hours. Include breaks and transitions. Be warm and encouraging. Keep your suggestions brief (3-5 sentences intro + the plan).

Respond with JSON in this exact format:
{
  "greeting": "A warm, encouraging morning greeting (1-2 sentences)",
  "mainFocus": "The single most important task/theme for today",
  "timeBlocks": [
    { "start": "HH:MM", "end": "HH:MM", "label": "Task or activity name", "energy": "high|medium|low|recharge", "task_id": "optional task id if matches a task" }
  ],
  "suggestion": "A brief motivational suggestion or tip for the day (1-2 sentences)"
}

Return ONLY the JSON, no other text.`,
      messages: [{ role: 'user', content: userMessage }],
    });

    const responseText =
      message.content[0].type === 'text' ? message.content[0].text : '';

    const plan = parseJsonFromResponse(responseText) as MorningPlanResponse;

    if (!plan.greeting || !plan.timeBlocks) {
      return NextResponse.json(
        { error: 'AI returned unexpected format' },
        { status: 502 }
      );
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error('morning-plan error:', error);

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
