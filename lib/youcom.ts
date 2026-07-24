import type { CompanyInput, LegResult, ThesisConfig } from './types';
import { buildPrompt } from './prompts';
import { buildOutputSchema, scoreFieldFor } from './schemas';

const RESEARCH_URL = 'https://api.you.com/v1/research';

function errorResult(leg: LegResult['leg'], message: string): LegResult {
  return { leg, content: '', score: 0, risks: [], sources: [], error: message };
}

export async function runResearchLeg(
  leg: LegResult['leg'],
  company: CompanyInput,
  thesis: ThesisConfig
): Promise<LegResult> {
  const apiKey = process.env.YDC_API_KEY;
  if (!apiKey) {
    return errorResult(leg, 'YDC_API_KEY is not configured on the server.');
  }

  const input = buildPrompt(leg, company, thesis);
  const outputSchema = buildOutputSchema(leg);
  const scoreField = scoreFieldFor(leg);

  let res: Response;
  try {
    res = await fetch(RESEARCH_URL, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input,
        research_effort: 'standard',
        output_schema: outputSchema,
      }),
    });
  } catch (err) {
    return errorResult(leg, err instanceof Error ? err.message : 'Network error calling Research API.');
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return errorResult(leg, `Research API returned ${res.status} ${res.statusText}: ${detail}`.trim());
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return errorResult(leg, 'Research API returned a non-JSON response.');
  }

  const output = (json as { output?: Record<string, unknown> }).output;
  const content = output?.content as Record<string, unknown> | undefined;
  if (!content) {
    return errorResult(leg, 'Research API response had no output.content.');
  }

  const rawSources = Array.isArray(output?.sources) ? (output!.sources as Array<Record<string, unknown>>) : [];
  const sources = rawSources.map((s) => ({
    url: String(s.url ?? ''),
    title: String(s.title ?? ''),
  }));

  const risks = Array.isArray(content.risks) ? (content.risks as unknown[]).map(String) : [];

  return {
    leg,
    content: String(content.narrative ?? ''),
    score: Number(content[scoreField] ?? 0),
    risks,
    sources,
  };
}
