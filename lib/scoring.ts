import type { CompanyInput, LegResult, Memo, RiskAppetite, Stage, ThesisConfig } from './types';

type LegWeights = Record<LegResult['leg'], number>;

const WEIGHTS: Record<Stage, LegWeights> = {
  'Pre-seed': { market: 25, founders: 50, competitive: 25 },
  Seed: { market: 30, founders: 40, competitive: 30 },
  'Series A': { market: 40, founders: 25, competitive: 35 },
  'Series B': { market: 40, founders: 20, competitive: 40 },
  'Series C+': { market: 35, founders: 15, competitive: 50 },
  Growth: { market: 30, founders: 10, competitive: 60 },
};

const THRESHOLDS: Record<RiskAppetite, { strongFit: number; fitWithReservations: number }> = {
  Conservative: { strongFit: 80, fitWithReservations: 60 },
  Balanced: { strongFit: 70, fitWithReservations: 50 },
  Aggressive: { strongFit: 60, fitWithReservations: 40 },
};

export function weightsFor(stage: Stage): LegWeights {
  return WEIGHTS[stage];
}

export function computeComposite(legs: LegResult[], stage: Stage): number {
  const weights = WEIGHTS[stage];
  const validLegs = legs.filter((leg) => !leg.error);
  const totalWeight = validLegs.reduce((sum, leg) => sum + weights[leg.leg], 0);
  if (totalWeight === 0) return 0;
  const weightedSum = validLegs.reduce((sum, leg) => sum + weights[leg.leg] * leg.score, 0);
  return Math.round(weightedSum / totalWeight);
}

export function recommendationFor(compositeScore: number, riskAppetite: RiskAppetite): Memo['recommendation'] {
  const { strongFit, fitWithReservations } = THRESHOLDS[riskAppetite];
  if (compositeScore >= strongFit) return 'Strong Fit';
  if (compositeScore >= fitWithReservations) return 'Fit with Reservations';
  return 'Pass';
}

export function aggregateRisks(legs: LegResult[]): string[] {
  const legRisks = legs.flatMap((leg) => leg.risks);
  const gapRisks = legs
    .filter((leg) => leg.error)
    .map((leg) => `${leg.leg} research leg failed (${leg.error}) — excluded from the composite score.`);
  return [...legRisks, ...gapRisks];
}

export function buildMemo(company: CompanyInput, thesis: ThesisConfig, legs: LegResult[]): Memo {
  const compositeScore = computeComposite(legs, thesis.stage);
  const recommendation = recommendationFor(compositeScore, thesis.riskAppetite);
  const risksAndOpenQuestions = aggregateRisks(legs);

  return {
    company,
    thesis,
    legs,
    compositeScore,
    recommendation,
    risksAndOpenQuestions,
  };
}
