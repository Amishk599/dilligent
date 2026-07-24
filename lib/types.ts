export type Stage = 'Pre-seed' | 'Seed' | 'Series A' | 'Series B' | 'Series C+' | 'Growth';
export type Sector =
  | 'Fintech'
  | 'AI-Dev-Tools'
  | 'Enterprise-SaaS'
  | 'Consumer'
  | 'Healthcare'
  | 'Biotech'
  | 'Climate'
  | 'Deep-Tech'
  | 'Hardware'
  | 'Crypto-Web3'
  | 'Other';
export type RiskAppetite = 'Conservative' | 'Balanced' | 'Aggressive';

export interface ThesisConfig {
  stage: Stage;
  sector: Sector;
  checkSize: number;
  riskAppetite: RiskAppetite;
  methodology?: string; // free-text fund investment methodology/principles, folded into research prompts
}

export interface CompanyInput {
  name: string;
  website: string;
  founders: string[];
}

export interface Source {
  url: string;
  title: string;
  snippets: string[];
  summary?: string; // AI-crunched, claim-relevant summary of the snippets; pre-computed once per leg
}

export interface LegResult {
  leg: 'market' | 'founders' | 'competitive';
  content: string; // markdown narrative with [[n]] citation markers
  keyPoints: string[]; // short scannable takeaways, same call as content
  score: number; // 0-100, this leg's dimension score
  risks: string[];
  sources: Source[];
  error?: string; // set if this leg's call failed
}

// Server-Sent Events emitted while a leg is researching, ahead of the final LegResult.
export type LegStreamEvent =
  | { type: 'phase'; phase: 'searching' | 'synthesizing'; label: string }
  | { type: 'sources'; sources: { url: string; title: string }[] }
  | { type: 'done'; result: LegResult }
  | { type: 'error'; message: string };

export interface Memo {
  company: CompanyInput;
  thesis: ThesisConfig;
  legs: LegResult[];
  compositeScore: number;
  recommendation: 'Strong Fit' | 'Fit with Reservations' | 'Pass';
  risksAndOpenQuestions: string[];
}

export interface SavedResearch {
  id: string;               // crypto.randomUUID()
  savedAt: string;          // ISO timestamp
  company: CompanyInput;
  thesis: ThesisConfig;
  legs: LegResult[];
  compositeScore: number;
  recommendation: Memo['recommendation'];
}
