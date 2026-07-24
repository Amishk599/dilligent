import type { LegResult } from './types';

const SCORE_FIELD: Record<LegResult['leg'], string> = {
  market: 'market_fit_score',
  founders: 'team_strength_score',
  competitive: 'competitive_position_score',
};

const SCORE_DESCRIPTION: Record<LegResult['leg'], string> = {
  market: "Score 0-100 for how well the market opportunity fits the given investment thesis.",
  founders: "Score 0-100 for how well the founding team's strength fits the given investment thesis.",
  competitive: "Score 0-100 for how well the competitive position fits the given investment thesis.",
};

export function scoreFieldFor(leg: LegResult['leg']): string {
  return SCORE_FIELD[leg];
}

export function buildFounderDiscoverySchema() {
  return {
    type: 'object',
    properties: {
      founders: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            title: { type: 'string' },
            source_url: {
              type: 'string',
              description: 'URL of a source confirming this person is a founder of this company.',
            },
          },
          required: ['name', 'title', 'source_url'],
          additionalProperties: false,
        },
      },
    },
    required: ['founders'],
    additionalProperties: false,
  } as const;
}

export function buildOutputSchema(leg: LegResult['leg']) {
  const scoreField = SCORE_FIELD[leg];
  return {
    type: 'object',
    properties: {
      narrative: {
        type: 'string',
        description: 'Markdown narrative with inline [[n]] citation markers referencing sources.',
      },
      key_points: {
        type: 'array',
        items: { type: 'string' },
        description: 'Short bullet-point takeaways summarizing the narrative.',
      },
      risks: {
        type: 'array',
        items: { type: 'string' },
        description: 'Concrete, non-generic risks or open questions surfaced by this research.',
      },
      [scoreField]: {
        type: 'integer',
        description: SCORE_DESCRIPTION[leg],
      },
    },
    required: ['narrative', 'key_points', 'risks', scoreField],
    additionalProperties: false,
  } as const;
}
