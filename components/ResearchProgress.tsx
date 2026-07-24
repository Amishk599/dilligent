'use client';

import { useEffect, useRef, useState } from 'react';
import type { CompanyInput, LegResult, ThesisConfig } from '@/lib/types';
import sampleMemo from '@/fixtures/sample-memo.json';

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
      <p className="text-sm text-neutral-500">
        Researching <span className="font-medium text-neutral-800">{company.name}</span> against a{' '}
        {thesis.riskAppetite.toLowerCase()}-risk {thesis.stage} {thesis.sector} thesis...
      </p>
      <ul className="space-y-3">
        {LEG_ORDER.map((leg) => {
          const state = legStates[leg];
          return (
            <li
              key={leg}
              className="flex items-center gap-3 rounded-lg border border-neutral-200 px-4 py-3"
            >
              <StatusIcon status={state.status} />
              <span className="font-medium">{LEG_LABELS[leg]}</span>
              <span className="ml-auto text-sm capitalize text-neutral-500">{state.status}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatusIcon({ status }: { status: LegStatus }) {
  const base = 'h-2.5 w-2.5 rounded-full';
  if (status === 'pending') return <span className={`${base} bg-neutral-300`} />;
  if (status === 'running') return <span className={`${base} animate-pulse bg-blue-500`} />;
  if (status === 'error') return <span className={`${base} bg-red-500`} />;
  return <span className={`${base} bg-green-500`} />;
}
