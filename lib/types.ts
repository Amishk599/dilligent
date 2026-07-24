export type Stage = 'Pre-seed' | 'Seed' | 'Series A';
export type Sector = 'Fintech' | 'AI-Dev-Tools' | 'Consumer' | 'Healthcare' | 'Other';
export type RiskAppetite = 'Conservative' | 'Balanced' | 'Aggressive';

export interface ThesisConfig {
  stage: Stage;
  sector: Sector;
  checkSize: number;
  riskAppetite: RiskAppetite;
}

export interface CompanyInput {
  name: string;
  website: string;
  founders: string[];
}

export interface LegResult {
  leg: 'market' | 'founders' | 'competitive';
  content: string; // markdown narrative with [[n]] citation markers
  score: number; // 0-100, this leg's dimension score
  risks: string[];
  sources: { url: string; title: string }[];
  error?: string; // set if this leg's call failed
}

export interface Memo {
  company: CompanyInput;
  thesis: ThesisConfig;
  legs: LegResult[];
  compositeScore: number;
  recommendation: 'Strong Fit' | 'Fit with Reservations' | 'Pass';
  risksAndOpenQuestions: string[];
}
