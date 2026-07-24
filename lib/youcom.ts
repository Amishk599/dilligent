import type { CompanyInput, LegResult, ThesisConfig } from './types';
import { buildFounderDiscoveryPrompt, buildPrompt } from './prompts';
import { buildFounderDiscoverySchema, buildOutputSchema, scoreFieldFor } from './schemas';

const RESEARCH_URL = 'https://api.you.com/v1/research';

interface ResearchCallResult {
  content?: Record<string, unknown>;
  sources: { url: string; title: string }[];
  error?: string;
}

async function callResearchApi(input: string, outputSchema: unknown): Promise<ResearchCallResult> {
  const apiKey = process.env.YDC_API_KEY;
  if (!apiKey) {
    return { sources: [], error: 'YDC_API_KEY is not configured on the server.' };
  }

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
    return { sources: [], error: err instanceof Error ? err.message : 'Network error calling Research API.' };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    return { sources: [], error: `Research API returned ${res.status} ${res.statusText}: ${detail}`.trim() };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { sources: [], error: 'Research API returned a non-JSON response.' };
  }

  const output = (json as { output?: Record<string, unknown> }).output;
  const content = output?.content as Record<string, unknown> | undefined;
  if (!content) {
    return { sources: [], error: 'Research API response had no output.content.' };
  }

  const rawSources = Array.isArray(output?.sources) ? (output!.sources as Array<Record<string, unknown>>) : [];
  const sources = rawSources.map((s) => ({
    url: String(s.url ?? ''),
    title: String(s.title ?? ''),
  }));

  return { content, sources };
}

export async function runResearchLeg(
  leg: LegResult['leg'],
  company: CompanyInput,
  thesis: ThesisConfig
): Promise<LegResult> {
  const input = buildPrompt(leg, company, thesis);
  const outputSchema = buildOutputSchema(leg);
  const scoreField = scoreFieldFor(leg);

  const { content, sources, error } = await callResearchApi(input, outputSchema);
  if (error || !content) {
    return { leg, content: '', score: 0, risks: [], sources: [], error: error ?? 'No content returned.' };
  }

  const risks = Array.isArray(content.risks) ? (content.risks as unknown[]).map(String) : [];

  return {
    leg,
    content: String(content.narrative ?? ''),
    score: Number(content[scoreField] ?? 0),
    risks,
    sources,
  };
}

export interface FounderCandidate {
  name: string;
  title: string;
  sourceUrl: string;
}

export interface FounderDiscoveryResult {
  founders: FounderCandidate[];
  error?: string;
}

export async function discoverFounders(name: string, website: string): Promise<FounderDiscoveryResult> {
  const input = buildFounderDiscoveryPrompt(name, website);
  const outputSchema = buildFounderDiscoverySchema();

  const { content, error } = await callResearchApi(input, outputSchema);
  if (error || !content) {
    return { founders: [], error: error ?? 'No content returned.' };
  }

  const rawFounders = Array.isArray(content.founders) ? (content.founders as Array<Record<string, unknown>>) : [];
  const founders = rawFounders
    .map((f) => ({
      name: String(f.name ?? '').trim(),
      title: String(f.title ?? '').trim(),
      sourceUrl: String(f.source_url ?? '').trim(),
    }))
    .filter((f) => f.name.length > 0);

  return { founders };
}
