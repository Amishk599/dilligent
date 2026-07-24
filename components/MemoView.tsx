import type { LegResult, Memo } from '@/lib/types';
import { weightsFor } from '@/lib/scoring';
import Eyebrow from './Eyebrow';

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

interface MemoViewProps {
  memo: Memo;
}

export default function MemoView({ memo }: MemoViewProps) {
  const weights = weightsFor(memo.thesis.stage);

  return (
    <div className="space-y-10">
      <ScoreHeader memo={memo} />

      <section className="grid grid-cols-3 gap-4">
        {memo.legs.map((leg) => (
          <DimensionCard key={leg.leg} leg={leg} weight={weights[leg.leg]} />
        ))}
      </section>

      <section className="space-y-4">
        {memo.legs.map((leg) => (
          <EvidenceSection key={leg.leg} leg={leg} />
        ))}
      </section>

      <RisksCallout risks={memo.risksAndOpenQuestions} />
    </div>
  );
}

function ScoreHeader({ memo }: { memo: Memo }) {
  return (
    <section className="grain-overlay rounded-2xl bg-accent-orange p-8 text-text-on-dark">
      <div className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-widest text-white/70">
          {memo.company.name} &middot; {memo.thesis.stage} &middot; {memo.thesis.sector} &middot;{' '}
          ${memo.thesis.checkSize.toLocaleString()} check &middot; {memo.thesis.riskAppetite} risk appetite
        </p>
        <div className="flex flex-wrap items-baseline gap-4">
          <span className="text-5xl font-bold tracking-tight">{memo.compositeScore}/100</span>
          <span className={`rounded-[10px] px-3 py-1 text-sm font-semibold ${RECOMMENDATION_STYLES[memo.recommendation]}`}>
            {memo.recommendation}
          </span>
        </div>
        <p className="text-sm text-white/70">
          Relative to the configured thesis only -- not an absolute or universal verdict.
        </p>
      </div>
    </section>
  );
}

function DimensionCard({ leg, weight }: { leg: LegResult; weight: number }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-white p-5">
      <div className={`h-10 w-10 rounded-lg ${LEG_TILE_CLASSES[leg.leg]}`} />
      <p className="mt-3 font-mono text-xs uppercase tracking-wider text-text-muted">
        {LEG_LABELS[leg.leg]} ({weight}%)
      </p>
      <p className="mt-1 text-2xl font-bold">{leg.error ? '—' : `${leg.score}/100`}</p>
    </div>
  );
}

function EvidenceSection({ leg }: { leg: LegResult }) {
  if (leg.error) {
    return (
      <details className="rounded-2xl border border-accent-brick/30 bg-accent-brick/5 p-5">
        <summary className="cursor-pointer font-medium text-accent-brick">
          {LEG_LABELS[leg.leg]} -- unavailable
        </summary>
        <p className="mt-2 text-sm text-accent-brick">
          This research leg failed and was excluded from the composite score: {leg.error}
        </p>
      </details>
    );
  }

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
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-text-primary/80">
        <CitedMarkdown content={leg.content} sources={leg.sources} />
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
function CitedMarkdown({ content, sources }: { content: string; sources: LegResult['sources'] }) {
  const blocks = content.split('\n\n').filter((block) => block.trim().length > 0);

  return (
    <>
      {blocks.map((block, i) => {
        if (block.startsWith('## ')) {
          return (
            <h3 key={i} className="font-semibold">
              {renderInline(block.slice(3), sources)}
            </h3>
          );
        }
        return <p key={i}>{renderInline(block, sources)}</p>;
      })}
    </>
  );
}

const INLINE_PATTERN = /\*\*(.+?)\*\*|\[\[(\d+)\]\]/g;

function renderInline(text: string, sources: LegResult['sources']): React.ReactNode[] {
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
          <a
            key={key++}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            title={source.title}
            className="font-mono text-xs text-accent-orange no-underline hover:underline"
          >
            [{citation}]
          </a>
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
