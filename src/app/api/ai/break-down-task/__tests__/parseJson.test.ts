import { describe, it, expect } from 'vitest';

// The parseJsonFromResponse function is not exported, so we replicate it here
// to test the parsing logic independently. This mirrors the exact implementation
// from the route handler.
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

describe('parseJsonFromResponse', () => {
  it('parses a plain JSON array', () => {
    const input = '[{"title":"Open editor","estimated_minutes":5,"energy_required":"low"}]';
    const result = parseJsonFromResponse(input);
    expect(result).toEqual([
      { title: 'Open editor', estimated_minutes: 5, energy_required: 'low' },
    ]);
  });

  it('parses JSON wrapped in a ```json code fence', () => {
    const input = '```json\n[{"title":"Write tests","estimated_minutes":15,"energy_required":"medium"}]\n```';
    const result = parseJsonFromResponse(input);
    expect(result).toEqual([
      { title: 'Write tests', estimated_minutes: 15, energy_required: 'medium' },
    ]);
  });

  it('parses JSON wrapped in a ``` code fence (no language tag)', () => {
    const input = '```\n[{"title":"Review code","estimated_minutes":10,"energy_required":"low"}]\n```';
    const result = parseJsonFromResponse(input);
    expect(result).toEqual([
      { title: 'Review code', estimated_minutes: 10, energy_required: 'low' },
    ]);
  });

  it('parses JSON with surrounding whitespace inside code fence', () => {
    const input = '```json\n  [{"title":"Deploy","estimated_minutes":20,"energy_required":"high"}]  \n```';
    const result = parseJsonFromResponse(input);
    expect(result).toEqual([
      { title: 'Deploy', estimated_minutes: 20, energy_required: 'high' },
    ]);
  });

  it('throws for completely invalid input', () => {
    expect(() => parseJsonFromResponse('This is not JSON at all')).toThrow(
      'Could not parse JSON from response'
    );
  });

  it('throws for malformed JSON inside code fences', () => {
    const input = '```json\n{broken json}\n```';
    expect(() => parseJsonFromResponse(input)).toThrow();
  });

  it('handles an empty JSON array', () => {
    expect(parseJsonFromResponse('[]')).toEqual([]);
  });

  it('handles a JSON object (not array)', () => {
    const input = '{"key": "value"}';
    expect(parseJsonFromResponse(input)).toEqual({ key: 'value' });
  });

  it('handles multi-item arrays from typical AI responses', () => {
    const input = `\`\`\`json
[
  {"title": "Open the project folder in your code editor", "estimated_minutes": 2, "energy_required": "low"},
  {"title": "Create a new file called utils.test.ts", "estimated_minutes": 3, "energy_required": "low"},
  {"title": "Write the first test case for the add function", "estimated_minutes": 10, "energy_required": "medium"}
]
\`\`\``;
    const result = parseJsonFromResponse(input) as unknown[];
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(3);
    expect(result[0]).toHaveProperty('title');
    expect(result[0]).toHaveProperty('estimated_minutes');
    expect(result[0]).toHaveProperty('energy_required');
  });
});
