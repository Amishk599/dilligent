import type { CompanyInput, LegResult, LegStreamEvent, Source, ThesisConfig } from './types';
import { buildFounderDiscoveryPrompt, buildPrompt, buildSearchQuery, buildSourceSummaryPrompt } from './prompts';
import { buildFounderDiscoverySchema, buildOutputSchema, buildSourceSummarySchema, scoreFieldFor } from './schemas';

const RESEARCH_URL = 'https://api.you.com/v1/research';
const SEARCH_URL = 'https://ydc-index.io/v1/search';

interface ResearchCallResult {
  content?: Record<string, unknown>;
  sources: { url: string; title: string; snippets: string[] }[];
  error?: string;
}

async function callResearchApi(
  input: string,
  outputSchema: unknown,
  effort: 'standard' | 'lite' = 'standard'
): Promise<ResearchCallResult> {
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
        research_effort: effort,
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
    snippets: Array.isArray(s.snippets) ? (s.snippets as unknown[]).map(String) : [],
  }));

  return { content, sources };
}

// Fast, lightweight Search API pass -- real candidate sources to show in the UI
// while the slower Research API call (below) is still synthesizing. Best-effort:
// failures here should never block the actual research leg.
async function searchWeb(query: string): Promise<{ url: string; title: string }[]> {
  const apiKey = process.env.YDC_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(`${SEARCH_URL}?query=${encodeURIComponent(query)}&count=5`, {
      headers: { 'X-API-Key': apiKey },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { results?: { web?: Array<{ url?: string; title?: string }> } };
    const web = json.results?.web ?? [];
    return web
      .map((r) => ({ url: String(r.url ?? ''), title: String(r.title ?? '') }))
      .filter((r) => r.url.length > 0);
  } catch {
    return [];
  }
}

// Batched, single lightweight Research API call per leg: crunches each source's raw snippet(s)
// into a short claim-relevant summary. Run once right after the leg's main call completes
// (not lazily per citation click) so opening the citation panel feels instant. Best-effort --
// failures here should never fail the leg, they just leave sources without a summary.
async function summarizeSources(
  leg: LegResult['leg'],
  company: CompanyInput,
  sources: Source[]
): Promise<Map<string, string>> {
  const withSnippets = sources.filter((s) => s.snippets.length > 0);
  if (withSnippets.length === 0) return new Map();

  const input = buildSourceSummaryPrompt(leg, company, withSnippets);
  const { content, error } = await callResearchApi(input, buildSourceSummarySchema(), 'lite');
  if (error || !content) return new Map();

  const raw = Array.isArray(content.summaries) ? (content.summaries as Array<Record<string, unknown>>) : [];
  const map = new Map<string, string>();
  for (const entry of raw) {
    const url = String(entry.url ?? '');
    const summary = String(entry.summary ?? '').trim();
    if (url && summary) map.set(url, summary);
  }
  return map;
}

// Same research leg, but emits real intermediate progress as it happens: a fast Search API
// pass surfaces candidate sources immediately, then the full Research API call runs and
// emits the final result. Every emitted event reflects an actual network call -- no simulated delays.
export async function runResearchLegStreaming(
  leg: LegResult['leg'],
  company: CompanyInput,
  thesis: ThesisConfig,
  emit: (event: LegStreamEvent) => void
): Promise<void> {
  emit({ type: 'phase', phase: 'searching', label: 'Searching web sources...' });

  const searchSources = await searchWeb(buildSearchQuery(leg, company));
  if (searchSources.length > 0) {
    emit({ type: 'sources', sources: searchSources });
  }

  emit({ type: 'phase', phase: 'synthesizing', label: 'Running deep research & scoring...' });

  const result = await runResearchLeg(leg, company, thesis);
  if (result.error) {
    emit({ type: 'error', message: result.error });
    return;
  }
  emit({ type: 'done', result });
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
    return {
      leg,
      content: '',
      keyPoints: [],
      score: 0,
      risks: [],
      sources: [],
      error: error ?? 'No content returned.',
    };
  }

  const risks = Array.isArray(content.risks) ? (content.risks as unknown[]).map(String) : [];
  const keyPoints = Array.isArray(content.key_points) ? (content.key_points as unknown[]).map(String) : [];

  const summaries = await summarizeSources(leg, company, sources);
  const summarizedSources = sources.map((s) => ({ ...s, summary: summaries.get(s.url) }));

  return {
    leg,
    content: String(content.narrative ?? ''),
    keyPoints,
    score: Number(content[scoreField] ?? 0),
    risks,
    sources: summarizedSources,
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
