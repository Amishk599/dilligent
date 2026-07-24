'use client';

import type { Memo, SavedResearch } from '@/lib/types';
import Link from 'next/link';

const RECOMMENDATION_STYLES: Record<Memo['recommendation'], string> = {
  'Strong Fit': 'bg-accent-yellowgreen text-text-primary',
  'Fit with Reservations': 'bg-accent-mustard text-text-primary',
  Pass: 'bg-bg-dark text-text-on-dark',
};

const SCORE_TILE: (score: number) => string = (score) => {
  if (score >= 80) return 'bg-accent-yellowgreen';
  if (score >= 60) return 'bg-accent-mustard';
  if (score >= 40) return 'bg-accent-orange';
  return 'bg-accent-brick';
};

function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface HistoryCardProps {
  entry: SavedResearch;
  onDelete: (id: string) => void;
}

export default function HistoryCard({ entry, onDelete }: HistoryCardProps) {
  const { id, company, thesis, compositeScore, recommendation, savedAt } = entry;

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onDelete(id);
  }

  return (
    <Link
      href={`/history/${id}`}
      className="group relative flex flex-col rounded-2xl border border-border-subtle bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-orange/30 hover:shadow-md"
    >
      {/* Score tile + score */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 shrink-0 rounded-lg ${SCORE_TILE(compositeScore)}`} />
          <div>
            <p className="text-xl font-bold leading-none">{compositeScore}/100</p>
            <span
              className={`mt-1 inline-block rounded-[7px] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${RECOMMENDATION_STYLES[recommendation]}`}
            >
              {recommendation}
            </span>
          </div>
        </div>

        {/* Delete button — only visible on hover */}
        <button
          type="button"
          onClick={handleDelete}
          aria-label={`Delete research for ${company.name}`}
          className="shrink-0 rounded-lg p-1.5 text-text-muted opacity-0 transition-all duration-150 hover:bg-accent-brick/10 hover:text-accent-brick group-hover:opacity-100"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path
              d="M1 3h12M5 3V2h4v1M2 3l1 9h8l1-9"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Company info */}
      <div className="mt-4 flex-1">
        <p className="text-base font-semibold leading-snug">{company.name}</p>
        {company.website && (
          <p className="mt-0.5 truncate font-mono text-xs text-text-muted">{company.website}</p>
        )}
      </div>

      {/* Thesis tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {[thesis.stage, thesis.sector, `$${thesis.checkSize.toLocaleString()}`].map((tag) => (
          <span
            key={tag}
            className="rounded-md bg-bg-cream px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-text-muted"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Timestamp */}
      <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-text-muted">
        {formatRelativeTime(savedAt)}
      </p>
    </Link>
  );
}
