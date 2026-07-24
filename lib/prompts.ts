import type { CompanyInput, LegResult, ThesisConfig } from './types';

function thesisContext(thesis: ThesisConfig): string {
  return (
    `Investment thesis to score against: Stage ${thesis.stage}, Sector ${thesis.sector}, ` +
    `Check size $${thesis.checkSize.toLocaleString()}, Risk appetite ${thesis.riskAppetite}. ` +
    `Score strictly relative to this thesis — never as an absolute or universal verdict.`
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
