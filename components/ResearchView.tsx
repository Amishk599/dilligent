'use client';

import { useEffect, useState } from 'react';
import type { CompanyInput, LegResult, LegStreamEvent, Memo, Source, ThesisConfig } from '@/lib/types';
import { aggregateRisks, computeComposite, recommendationFor, weightsFor } from '@/lib/scoring';
import Eyebrow from './Eyebrow';

type LegStatus = 'pending' | 'running' | 'done' | 'error';

interface LiveSource {
  url: string;
  title: string;
}

interface LegSlot {
  leg: LegResult['leg'];
  status: LegStatus;
  phaseLabel?: string;
  liveSources: LiveSource[];
  result?: LegResult;
  error?: string;
}

const LEG_ORDER: LegResult['leg'][] = ['market', 'founders', 'competitive'];

const LEG_LABELS: Record<LegResult['leg'], string> = {
  market: 'Market Fit',
  founders: 'Team Strength',
  competitive: 'Competitive Position',
};

const LEG_TILE_CLASSES: Record<LegResult['leg'], string> = {
  market: 'bg-accent-orange',
  founders: 'bg-accent-mustard',
  competitive: 'bg-accent-brick',
};

const RECOMMENDATION_STYLES: Record<Memo['recommendation'], string> = {
  'Strong Fit': 'bg-accent-yellowgreen text-text-primary',
  'Fit with Reservations': 'bg-accent-mustard text-text-primary',
  Pass: 'bg-bg-dark text-text-on-dark',
};

function initialLegSlots(): Record<LegResult['leg'], LegSlot> {
  return Object.fromEntries(
    LEG_ORDER.map((leg) => [leg, { leg, status: 'pending' as LegStatus, liveSources: [] as LiveSource[] }])
  ) as unknown as Record<LegResult['leg'], LegSlot>;
}

// Opens a real streaming POST to /api/research/{leg} and parses the SSE frames it emits
// (phase changes, sources as they're found, then the final result) as they arrive over the wire.
async function streamLeg(
  leg: LegResult['leg'],
  company: CompanyInput,
  thesis: ThesisConfig,
  onEvent: (event: LegStreamEvent) => void,
  signal: AbortSignal
): Promise<void> {
  const res = await fetch(`/api/research/${leg}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company, thesis }),
    signal,
  });

  if (!res.body) {
    onEvent({ type: 'error', message: 'No response stream from server.' });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';
    for (const frame of frames) {
      const line = frame.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;
      try {
        onEvent(JSON.parse(line.slice('data: '.length)) as LegStreamEvent);
      } catch {
        // Ignore malformed frames rather than killing the whole stream.
      }
    }
  }
}

interface ResearchViewProps {
  company: CompanyInput;
  thesis: ThesisConfig;
}

// Single continuously-updating view: each of the 3 leg slots independently renders
// pending -> running-with-ticker -> filled-in card as its own SSE stream settles, rather
// than gating everything behind all 3 legs completing.
export default function ResearchView({ company, thesis }: ResearchViewProps) {
  const [legSlots, setLegSlots] = useState<Record<LegResult['leg'], LegSlot>>(initialLegSlots);
  const [citedSource, setCitedSource] = useState<Source | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    function update(leg: LegResult['leg'], patch: Partial<LegSlot>) {
      setLegSlots((prev) => ({ ...prev, [leg]: { ...prev[leg], ...patch } }));
    }

    for (const leg of LEG_ORDER) {
      update(leg, { status: 'running' });
      streamLeg(
        leg,
        company,
        thesis,
        (event) => {
          switch (event.type) {
            case 'phase':
              update(leg, { phaseLabel: event.label });
              break;
            case 'sources':
              setLegSlots((prev) => ({
                ...prev,
                [leg]: { ...prev[leg], liveSources: [...prev[leg].liveSources, ...event.sources] },
              }));
              break;
            case 'done':
              update(leg, { status: 'done', result: event.result, phaseLabel: undefined });
              break;
            case 'error':
              update(leg, { status: 'error', error: event.message, phaseLabel: undefined });
              break;
          }
        },
        controller.signal
      ).catch((err) => {
        if (controller.signal.aborted) return;
        update(leg, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Stream failed.',
          phaseLabel: undefined,
        });
      });
    }

    return () => controller.abort();
    // company/thesis are captured once per research run; ResearchView is remounted per run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weights = weightsFor(thesis.stage);
  const allSettled = LEG_ORDER.every((leg) => legSlots[leg].status === 'done' || legSlots[leg].status === 'error');

  let composite: { compositeScore: number; recommendation: Memo['recommendation'] } | null = null;
  if (allSettled) {
    const legs: LegResult[] = LEG_ORDER.map(
      (leg) =>
        legSlots[leg].result ?? {
          leg,
          content: '',
          keyPoints: [],
          score: 0,
          risks: [],
          sources: [],
          error: legSlots[leg].error ?? 'No result returned.',
        }
    );
    const compositeScore = computeComposite(legs, thesis.stage);
    composite = { compositeScore, recommendation: recommendationFor(compositeScore, thesis.riskAppetite) };
  }

  const settledRisks = aggregateRisks(
    LEG_ORDER.filter((leg) => legSlots[leg].status === 'done' || legSlots[leg].status === 'error').map(
      (leg) =>
        legSlots[leg].result ?? {
          leg,
          content: '',
          keyPoints: [],
          score: 0,
          risks: [],
          sources: [],
          error: legSlots[leg].error,
        }
    )
  );

  return (
    <div className="space-y-10">
      <ScoreHeader company={company} thesis={thesis} composite={composite} />

      <section className="grid grid-cols-3 gap-4">
        {LEG_ORDER.map((leg) => (
          <DimensionCard key={leg} slot={legSlots[leg]} weight={weights[leg]} />
        ))}
      </section>

      <section className="space-y-4">
        {LEG_ORDER.map((leg) => (
          <EvidenceSection key={leg} slot={legSlots[leg]} onCiteClick={setCitedSource} />
        ))}
      </section>

      <RisksCallout risks={settledRisks} />

      <CitationPanel source={citedSource} onClose={() => setCitedSource(null)} />
    </div>
  );
}

function ScoreHeader({
  company,
  thesis,
  composite,
}: {
  company: CompanyInput;
  thesis: ThesisConfig;
  composite: { compositeScore: number; recommendation: Memo['recommendation'] } | null;
}) {
  return (
    <section className="grain-overlay rounded-2xl bg-accent-orange p-8 text-text-on-dark">
      <div className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-white/70">
          {company.name} &middot; {thesis.stage} &middot; {thesis.sector} &middot;{' '}
          ${thesis.checkSize.toLocaleString()} check &middot; {thesis.riskAppetite} risk appetite
        </p>
        <div className="flex flex-wrap items-baseline gap-4">
          {composite ? (
            <>
              <span className="text-5xl font-bold tracking-tight">{composite.compositeScore}/100</span>
              <span
                className={`rounded-[10px] px-3 py-1 text-sm font-semibold ${RECOMMENDATION_STYLES[composite.recommendation]}`}
              >
                {composite.recommendation}
              </span>
            </>
          ) : (
            <span className="animate-pulse text-2xl font-semibold text-white/70">Calculating composite score...</span>
          )}
        </div>
        <p className="text-sm text-white/70">
          Relative to the configured thesis only -- not an absolute or universal verdict.
        </p>
      </div>
    </section>
  );
}

function DimensionCard({ slot, weight }: { slot: LegSlot; weight: number }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-white p-5">
      <div
        className={`h-10 w-10 rounded-lg ${
          slot.status === 'done'
            ? LEG_TILE_CLASSES[slot.leg]
            : slot.status === 'running'
              ? 'animate-pulse bg-accent-orange/50'
              : slot.status === 'error'
                ? 'bg-accent-brick/50'
                : 'bg-text-muted/20'
        }`}
      />
      <p className="mt-3 font-mono text-xs uppercase tracking-wider text-text-muted">
        {LEG_LABELS[slot.leg]} ({weight}%)
      </p>
      <p className="mt-1 text-2xl font-bold">
        {slot.status === 'done' && slot.result ? `${slot.result.score}/100` : slot.status === 'error' ? '—' : '...'}
      </p>
    </div>
  );
}

function EvidenceSection({ slot, onCiteClick }: { slot: LegSlot; onCiteClick: (source: Source) => void }) {
  if (slot.status === 'pending' || slot.status === 'running') {
    return (
      <div className="rounded-2xl border border-border-subtle bg-white p-5">
        <div className="flex items-center gap-3 font-medium">
          <span
            className={`h-8 w-8 shrink-0 rounded-lg ${slot.status === 'running' ? 'animate-pulse bg-accent-orange/50' : 'bg-text-muted/20'}`}
          />
          {LEG_LABELS[slot.leg]}
          <span className="ml-auto font-mono text-xs uppercase tracking-wider text-text-muted">
            {slot.phaseLabel ?? slot.status}
          </span>
        </div>
        {slot.liveSources.length > 0 && (
          <ul className="mt-3 space-y-1 border-t border-border-subtle pt-3">
            {slot.liveSources.slice(-4).map((source, i) => (
              <li
                key={`${source.url}-${i}`}
                className="animate-source-in flex items-center gap-2 truncate font-mono text-xs text-text-muted"
              >
                <span className="h-1 w-1 shrink-0 rounded-full bg-accent-mustard" />
                <span className="truncate">{source.title || source.url}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (slot.status === 'error' || !slot.result) {
    return (
      <details className="rounded-2xl border border-accent-brick/30 bg-accent-brick/5 p-5">
        <summary className="cursor-pointer font-medium text-accent-brick">
          {LEG_LABELS[slot.leg]} -- unavailable
        </summary>
        <p className="mt-2 text-sm text-accent-brick">
          This research leg failed and was excluded from the composite score: {slot.error}
        </p>
      </details>
    );
  }

  const leg = slot.result;

  return (
    <details className="group rounded-2xl border border-border-subtle bg-white p-5" open>
      <summary className="flex cursor-pointer items-center gap-3 font-medium marker:content-none [&::-webkit-details-marker]:hidden">
        <span className={`h-8 w-8 shrink-0 rounded-lg ${LEG_TILE_CLASSES[leg.leg]}`} />
        {LEG_LABELS[leg.leg]}
        <svg
          className="ml-auto h-3 w-3 text-text-muted transition-transform group-open:rotate-90"
          viewBox="0 0 9 9"
          fill="none"
        >
          <path d="M2 1l3.5 3.5L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="mt-4 space-y-4 text-sm leading-relaxed text-text-primary/80">
        {leg.keyPoints.length > 0 ? (
          <ul className="space-y-2">
            {leg.keyPoints.map((point, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-orange" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        ) : (
          <CitedMarkdown content={leg.content} sources={leg.sources} onCiteClick={onCiteClick} />
        )}

        {leg.keyPoints.length > 0 && leg.content && (
          <details className="rounded-xl border border-border-subtle/60 bg-bg-cream/50 p-3">
            <summary className="cursor-pointer font-mono text-xs uppercase tracking-wider text-text-muted">
              Read full analysis
            </summary>
            <div className="mt-3 space-y-3">
              <CitedMarkdown content={leg.content} sources={leg.sources} onCiteClick={onCiteClick} />
            </div>
          </details>
        )}
      </div>
    </details>
  );
}

function RisksCallout({ risks }: { risks: string[] }) {
  if (risks.length === 0) return null;
  return (
    <section className="rounded-2xl border border-border-subtle bg-accent-mustard/15 p-6">
      <Eyebrow className="text-accent-brick">Risks &amp; Open Questions</Eyebrow>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-text-primary/80">
        {risks.map((risk, i) => (
          <li key={i}>{risk}</li>
        ))}
      </ul>
    </section>
  );
}

// Minimal markdown renderer scoped to what the Research API's narrative
// output actually uses: "## " headings, "**bold**", and [[n]] citation
// markers that resolve to that leg's sources[n-1].
function CitedMarkdown({
  content,
  sources,
  onCiteClick,
}: {
  content: string;
  sources: LegResult['sources'];
  onCiteClick: (source: Source) => void;
}) {
  const blocks = content.split('\n\n').filter((block) => block.trim().length > 0);

  return (
    <>
      {blocks.map((block, i) => {
        if (block.startsWith('## ')) {
          return (
            <h3 key={i} className="font-semibold">
              {renderInline(block.slice(3), sources, onCiteClick)}
            </h3>
          );
        }
        return <p key={i}>{renderInline(block, sources, onCiteClick)}</p>;
      })}
    </>
  );
}

const INLINE_PATTERN = /\*\*(.+?)\*\*|\[\[(\d+)\]\]/g;

function renderInline(
  text: string,
  sources: LegResult['sources'],
  onCiteClick: (source: Source) => void
): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  INLINE_PATTERN.lastIndex = 0;
  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const [, bold, citation] = match;
    if (bold !== undefined) {
      nodes.push(<strong key={key++}>{bold}</strong>);
    } else if (citation !== undefined) {
      const source = sources[Number(citation) - 1];
      if (source) {
        nodes.push(
          <button
            key={key++}
            type="button"
            onClick={() => onCiteClick(source)}
            title={source.title}
            className="rounded px-0.5 font-mono text-xs text-accent-orange hover:bg-accent-orange/10 hover:underline"
          >
            [{citation}]
          </button>
        );
      } else {
        nodes.push(`[[${citation}]]`);
      }
    }

    lastIndex = INLINE_PATTERN.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function CitationPanel({ source, onClose }: { source: Source | null; onClose: () => void }) {
  const isOpen = source !== null;

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
      aria-hidden={!isOpen}
    >
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-white p-6 shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {source && (
          <>
            <div className="flex items-start justify-between gap-4">
              <Eyebrow className="text-accent-orange">Cited Source</Eyebrow>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg px-2 py-1 text-text-muted hover:bg-bg-cream"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <h3 className="mt-3 text-lg font-semibold leading-snug">{source.title || source.url}</h3>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 truncate font-mono text-xs text-accent-orange hover:underline"
            >
              {source.url}
            </a>

            <div className="mt-5 space-y-3">
              {source.summary ? (
                <p className="rounded-xl border-l-4 border-accent-mustard bg-accent-mustard/10 p-4 text-sm leading-relaxed text-text-primary/85">
                  {source.summary}
                </p>
              ) : source.snippets.length === 0 ? (
                <p className="text-sm text-text-muted">No excerpt available -- open the source to verify directly.</p>
              ) : null}

              {source.snippets.length > 0 && (
                <details className="rounded-xl border border-border-subtle/60 p-3">
                  <summary className="cursor-pointer font-mono text-xs uppercase tracking-wider text-text-muted">
                    Show full excerpt
                  </summary>
                  <div className="mt-3 space-y-3">
                    {source.snippets.map((snippet, i) => (
                      <blockquote
                        key={i}
                        className="rounded-xl border-l-4 border-accent-mustard bg-accent-mustard/10 p-4 text-sm leading-relaxed text-text-primary/85"
                      >
                        {snippet}
                      </blockquote>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
