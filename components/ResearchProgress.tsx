'use client';

import { useEffect, useRef, useState } from 'react';
import type { CompanyInput, LegResult, ThesisConfig } from '@/lib/types';
import sampleMemo from '@/fixtures/sample-memo.json';
import Eyebrow from './Eyebrow';

type LegStatus = 'pending' | 'running' | 'done' | 'error';

interface LegState {
  leg: LegResult['leg'];
  status: LegStatus;
  result?: LegResult;
}

const LEG_ORDER: LegResult['leg'][] = ['market', 'founders', 'competitive'];

const LEG_LABELS: Record<LegResult['leg'], string> = {
  market: 'Market',
  founders: 'Founders',
  competitive: 'Competitive',
};

function initialLegStates(): Record<LegResult['leg'], LegState> {
  return Object.fromEntries(LEG_ORDER.map((leg) => [leg, { leg, status: 'pending' as LegStatus }])) as Record<
    LegResult['leg'],
    LegState
  >;
}

// Fixture-driven simulation of the 3 research legs completing at staggered times.
// Phase 7 swaps this function's body for real parallel fetch() calls to
// /api/research/{market,founders,competitive} -- the status-rendering JSX
// in the component below should not need to change.
function simulateLegs(onLegUpdate: (leg: LegResult['leg'], status: LegStatus, result?: LegResult) => void): () => void {
  const timers: ReturnType<typeof setTimeout>[] = [];
  const fixtureLegs = (sampleMemo as { legs: LegResult[] }).legs;

  const delaysMs: Record<LegResult['leg'], number> = {
    market: 2200,
    founders: 3600,
    competitive: 4800,
  };

  for (const leg of LEG_ORDER) {
    onLegUpdate(leg, 'running');
    const fixtureResult = fixtureLegs.find((l) => l.leg === leg);
    timers.push(
      setTimeout(() => {
        onLegUpdate(leg, fixtureResult?.error ? 'error' : 'done', fixtureResult);
      }, delaysMs[leg])
    );
  }

  return () => timers.forEach(clearTimeout);
}

interface ResearchProgressProps {
  company: CompanyInput;
  thesis: ThesisConfig;
  onComplete: (legs: LegResult[]) => void;
}

export default function ResearchProgress({ company, thesis, onComplete }: ResearchProgressProps) {
  const [legStates, setLegStates] = useState<Record<LegResult['leg'], LegState>>(initialLegStates);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    return simulateLegs((leg, status, result) => {
      setLegStates((prev) => ({ ...prev, [leg]: { leg, status, result } }));
    });
  }, []);

  useEffect(() => {
    const allSettled = LEG_ORDER.every((leg) => {
      const status = legStates[leg].status;
      return status === 'done' || status === 'error';
    });
    if (!allSettled) return;

    const legs = LEG_ORDER.map(
      (leg) =>
        legStates[leg].result ?? {
          leg,
          content: '',
          score: 0,
          risks: [],
          sources: [],
          error: 'No result returned.',
        }
    );
    onCompleteRef.current(legs);
  }, [legStates]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Eyebrow className="text-accent-mustard">Researching</Eyebrow>
        <p className="text-lg">
          <span className="font-semibold">{company.name}</span>
          <span className="text-white/50">
            {' '}
            against a {thesis.riskAppetite.toLowerCase()}-risk {thesis.stage} {thesis.sector} thesis
          </span>
        </p>
      </div>
      <ul className="space-y-3">
        {LEG_ORDER.map((leg) => {
          const state = legStates[leg];
          return (
            <li
              key={leg}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
            >
              <StatusTile status={state.status} />
              <span className="font-medium">{LEG_LABELS[leg]}</span>
              <span className="ml-auto font-mono text-xs uppercase tracking-wider text-white/50">
                {state.status}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const STATUS_TILE_CLASSES: Record<LegStatus, string> = {
  pending: 'bg-white/10',
  running: 'bg-accent-orange animate-pulse',
  done: 'bg-accent-mustard',
  error: 'bg-accent-brick',
};

function StatusTile({ status }: { status: LegStatus }) {
  return <span className={`h-10 w-10 shrink-0 rounded-lg ${STATUS_TILE_CLASSES[status]}`} />;
}
