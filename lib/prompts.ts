import type { CompanyInput, LegResult, ThesisConfig } from './types';

function thesisContext(thesis: ThesisConfig): string {
  const base =
    `Investment thesis to score against: Stage ${thesis.stage}, Sector ${thesis.sector}, ` +
    `Check size $${thesis.checkSize.toLocaleString()}, Risk appetite ${thesis.riskAppetite}. ` +
    `Score strictly relative to this thesis — never as an absolute or universal verdict.`;

  if (!thesis.methodology?.trim()) return base;

  return (
    `${base} Apply this fund's investment methodology and principles when researching, ` +
    `weighing evidence, and scoring — let it shape which risks and strengths you emphasize:\n` +
    `"""\n${thesis.methodology.trim()}\n"""`
  );
}

function companyHeader(company: CompanyInput): string {
  return `Company: ${company.name} (${company.website}).`;
}

export function buildFounderDiscoveryPrompt(name: string, website: string): string {
  return (
    `Identify the public founders/co-founders of ${name} (${website}). For each person, ` +
    `give their full name, their founding title/role (e.g. "Co-founder & CEO"), and a source URL ` +
    `that confirms they are a founder of this specific company. Only include people publicly ` +
    `confirmed as founders or co-founders — do not include employees, investors, or advisors ` +
    `who are not founders.`
  );
}

// Short keyword query for the fast Search API pass that precedes the full Research API call
// -- gives the UI real source URLs to show while the deeper synthesis is still running.
export function buildSearchQuery(leg: LegResult['leg'], company: CompanyInput): string {
  switch (leg) {
    case 'market':
      return `${company.name} market size growth trends`;
    case 'founders':
      return `${company.founders.join(' ')} ${company.name} founder background`;
    case 'competitive':
      return `${company.name} competitors landscape`;
  }
}

const LEG_TOPIC: Record<LegResult['leg'], string> = {
  market: 'the market opportunity (size, growth, tailwinds/headwinds)',
  founders: "the founders' professional background and domain experience",
  competitive: 'the competitive landscape and differentiation',
};

// Batched, single call per leg: crunches each source's raw snippet(s) down to a short
// claim-relevant summary, run once when the leg's research completes (not on citation click).
export function buildSourceSummaryPrompt(
  leg: LegResult['leg'],
  company: CompanyInput,
  sources: { url: string; title: string; snippets: string[] }[]
): string {
  const topic = LEG_TOPIC[leg];
  const list = sources
    .map((s, i) => `${i + 1}. URL: ${s.url}\n   Title: ${s.title}\n   Excerpt: ${s.snippets.join(' ... ').slice(0, 1500)}`)
    .join('\n\n');

  return (
    `Below are raw excerpts from sources used to research ${company.name} regarding ${topic}. ` +
    `For each source, write a short (1-2 sentence) plain-language summary of what that specific ` +
    `excerpt says relevant to that topic. Do not add outside information, do not include citation ` +
    `markers, and return one summary per source, matched back to its URL.\n\n${list}`
  );
}

export function buildPrompt(leg: LegResult['leg'], company: CompanyInput, thesis: ThesisConfig): string {
  const header = companyHeader(company);
  const thesisLine = thesisContext(thesis);

  switch (leg) {
    case 'market':
      return (
        `${header} Research this company's target market: market size, growth trends, ` +
        `and tailwinds/headwinds. ${thesisLine}`
      );
    case 'founders':
      return (
        `${header} Founders: ${company.founders.join(', ')}. Research each founder's public ` +
        `professional background, past companies/exits, and domain experience. Use only public, ` +
        `professional information about the founders — no personal information. ${thesisLine}`
      );
    case 'competitive':
      return (
        `${header} Research the competitive landscape: direct competitors, differentiation, ` +
        `and moat signals. ${thesisLine}`
      );
  }
}
