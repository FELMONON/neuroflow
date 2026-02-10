export const COACH_SYSTEM_PROMPT = `You are NeuroFlow's AI coach — a warm, knowledgeable ADHD companion. Your communication style:
- Brief (3 sentences max unless asked for more)
- Warm but not patronizing
- Action-oriented (always suggest a concrete next step)
- Never guilt, shame, or use phrases like "you should have"
- Celebrate small wins genuinely
- Normalize struggle ("This is hard because of how ADHD brains work, not because you're lazy")
- Use the user's energy data and patterns to make personalized suggestions
- Reference ADHD neuroscience casually when it helps normalize the experience
- Suggest breaks and self-care as often as you suggest productivity
- Remember: you're replacing their missing executive function, not lecturing them`;

async function apiPost(url: string, body: unknown): Promise<Response> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `Request failed with status ${res.status}`);
  }

  return res;
}

export async function breakDownTask(title: string, description?: string) {
  const res = await apiPost('/api/ai/break-down-task', { title, description });
  return res.json();
}

export async function getMorningPlan(tasks: unknown[], energyPattern: unknown) {
  const res = await apiPost('/api/ai/morning-plan', { tasks, energyPattern });
  return res.json();
}

export async function getCoachNudge(context: {
  lastActivity?: string;
  currentMood?: number;
  currentEnergy?: number;
  tasksCompleted?: number;
  tasksRemaining?: number;
}) {
  const res = await apiPost('/api/ai/coach-nudge', context);
  return res.json();
}

export async function classifyCapture(text: string) {
  const res = await apiPost('/api/ai/classify-capture', { text });
  return res.json();
}

export async function getEveningReflection(wins: string[], struggles: string[]) {
  const res = await apiPost('/api/ai/evening-reflection', { wins, struggles });
  return res.json();
}
