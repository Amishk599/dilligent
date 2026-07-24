'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import PixelMark from '@/components/PixelMark';
import HistoryCard from '@/components/HistoryCard';
import { clearHistory, deleteResearch, loadHistory } from '@/lib/history';
import type { SavedResearch } from '@/lib/types';

export default function HistoryPage() {
  const [entries, setEntries] = useState<SavedResearch[]>([]);
  const [mounted, setMounted] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setEntries(loadHistory());
    setMounted(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteResearch(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearHistory();
    setEntries([]);
    setConfirmClear(false);
  }, [confirmClear]);

  return (
    <div className="min-h-screen bg-bg-cream text-text-primary">
      <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-border-subtle bg-bg-cream/85 px-6 py-5 backdrop-blur-sm">
        <Link href="/" className="flex items-center gap-2.5">
          <PixelMark />
          <span className="text-lg font-bold tracking-tight">Dilligent</span>
        </Link>
        <div className="flex items-center gap-5">
          <Link
            href="/analyze"
            className="font-mono text-xs uppercase tracking-widest text-text-muted transition-colors hover:text-text-primary"
          >
            New Research
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-12">
        {/* Page header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-accent-orange">Research Archive</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Past Researches</h1>
            {mounted && entries.length > 0 && (
              <p className="mt-1 text-sm text-text-muted">
                {entries.length} {entries.length === 1 ? 'run' : 'runs'} saved locally
              </p>
            )}
          </div>

          {mounted && entries.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              onBlur={() => setConfirmClear(false)}
              className={`shrink-0 rounded-[9px] px-3 py-1.5 font-mono text-xs uppercase tracking-widest transition-all duration-150 ${
                confirmClear
                  ? 'bg-accent-brick text-white'
                  : 'border border-border-subtle text-text-muted hover:border-accent-brick/30 hover:text-accent-brick'
              }`}
            >
              {confirmClear ? 'Confirm clear all' : 'Clear all'}
            </button>
          )}
        </div>

        <div className="mt-8">
          {!mounted ? (
            // Skeleton grid while hydrating
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-52 animate-pulse rounded-2xl border border-border-subtle bg-white"
                />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map((entry) => (
                <HistoryCard key={entry.id} entry={entry} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </main>

      <FloatingBadge />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="dot-grid flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-border-subtle text-center">
      <div className="space-y-1">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-orange/10">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
            <rect x="4" y="4" width="8" height="8" rx="2" fill="#f5511e" fillOpacity=".5" />
            <rect x="16" y="4" width="8" height="8" rx="2" fill="#f5511e" fillOpacity=".25" />
            <rect x="4" y="16" width="8" height="8" rx="2" fill="#f5511e" fillOpacity=".25" />
            <rect x="16" y="16" width="8" height="8" rx="2" fill="#f5511e" fillOpacity=".1" />
          </svg>
        </div>
        <p className="mt-4 text-lg font-semibold">No researches yet</p>
        <p className="mt-1 max-w-xs text-sm text-text-muted">
          Completed research runs are saved automatically. Run your first analysis to see it here.
        </p>
      </div>
      <Link
        href="/analyze"
        className="mt-8 inline-flex items-center gap-2 rounded-[11px] bg-text-primary px-5 py-2.5 text-sm font-medium text-text-on-dark transition-opacity hover:opacity-90"
      >
        Start a research
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
          <path d="M2 1l3.5 3.5L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  );
}

function FloatingBadge() {
  return (
    <div className="fixed bottom-5 right-5 flex items-center gap-2 rounded-xl bg-text-primary px-3 py-2 text-text-on-dark shadow-lg">
      <PixelMark className="h-3.5 w-3.5" />
      <span className="font-mono text-[10px] uppercase tracking-widest">Powered by You.com</span>
    </div>
  );
}
