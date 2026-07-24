import type { LegResult, Memo } from '@/lib/types';
import { weightsFor } from '@/lib/scoring';

const LEG_LABELS: Record<LegResult['leg'], string> = {
  market: 'Market Fit',
  founders: 'Team Strength',
  competitive: 'Competitive Position',
};

const RECOMMENDATION_STYLES: Record<Memo['recommendation'], string> = {
  'Strong Fit': 'bg-green-100 text-green-800',
  'Fit with Reservations': 'bg-amber-100 text-amber-800',
  Pass: 'bg-red-100 text-red-800',
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
    <section className="space-y-2 border-b border-neutral-200 pb-6">
      <p className="text-sm text-neutral-500">
        {memo.company.name} &middot; {memo.thesis.stage} &middot; {memo.thesis.sector} &middot;{' '}
        ${memo.thesis.checkSize.toLocaleString()} check &middot; {memo.thesis.riskAppetite} risk appetite
      </p>
      <div className="flex items-baseline gap-4">
        <span className="text-4xl font-semibold">{memo.compositeScore}/100</span>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${RECOMMENDATION_STYLES[memo.recommendation]}`}>
          {memo.recommendation}
        </span>
      </div>
      <p className="text-sm text-neutral-500">
        Relative to the configured thesis only -- not an absolute or universal verdict.
      </p>
    </section>
  );
}

function DimensionCard({ leg, weight }: { leg: LegResult; weight: number }) {
  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <p className="text-sm text-neutral-500">
        {LEG_LABELS[leg.leg]} <span className="text-neutral-400">({weight}% weight)</span>
      </p>
      <p className="mt-1 text-2xl font-semibold">{leg.error ? '—' : `${leg.score}/100`}</p>
    </div>
  );
}

function EvidenceSection({ leg }: { leg: LegResult }) {
  if (leg.error) {
    return (
      <details className="rounded-lg border border-red-200 bg-red-50 p-4">
        <summary className="cursor-pointer font-medium text-red-800">
          {LEG_LABELS[leg.leg]} -- unavailable
        </summary>
        <p className="mt-2 text-sm text-red-700">
          This research leg failed and was excluded from the composite score: {leg.error}
        </p>
      </details>
    );
  }

  return (
    <details className="rounded-lg border border-neutral-200 p-4" open>
      <summary className="cursor-pointer font-medium">{LEG_LABELS[leg.leg]}</summary>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-neutral-700">
        <CitedMarkdown content={leg.content} sources={leg.sources} />
      </div>
    </details>
  );
}

function RisksCallout({ risks }: { risks: string[] }) {
  if (risks.length === 0) return null;
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h2 className="font-medium text-amber-900">Risks &amp; Open Questions</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
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
            className="text-blue-600 no-underline hover:underline"
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
