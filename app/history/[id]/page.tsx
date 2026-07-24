'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PixelMark from '@/components/PixelMark';
import ResearchView from '@/components/ResearchView';
import { getResearch } from '@/lib/history';
import type { SavedResearch } from '@/lib/types';

export default function HistoryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<SavedResearch | null | undefined>(undefined); // undefined = loading

  useEffect(() => {
    const found = getResearch(params.id);
    setEntry(found); // null if not found
  }, [params.id]);

  if (entry === undefined) {
    // Hydrating — show skeleton
    return (
      <div className="min-h-screen bg-bg-cream">
        <NavBar />
        <main className="mx-auto max-w-3xl px-6 py-12">
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl border border-border-subtle bg-white" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (entry === null) {
    return (
      <div className="min-h-screen bg-bg-cream">
        <NavBar />
        <main className="mx-auto flex max-w-3xl flex-col items-center px-6 py-24 text-center">
          <p className="text-lg font-semibold">Research not found</p>
          <p className="mt-2 text-sm text-text-muted">
            This research may have been deleted or the link is invalid.
          </p>
          <Link
            href="/history"
            className="mt-6 inline-flex items-center gap-2 rounded-[11px] bg-text-primary px-5 py-2.5 text-sm font-medium text-text-on-dark transition-opacity hover:opacity-90"
          >
            Back to Past Researches
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-cream text-text-primary">
      <NavBar />

      {/* Breadcrumb */}
      <div className="border-b border-border-subtle/50 px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-2 font-mono text-xs uppercase tracking-widest text-text-muted">
          <Link href="/history" className="transition-colors hover:text-text-primary">
            Past Researches
          </Link>
          <span>/</span>
          <span className="text-text-primary">{entry.company.name}</span>
          <span className="ml-auto">
            {new Date(entry.savedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Read-only banner */}
        <div className="mb-6 flex items-center gap-2 rounded-[10px] border border-border-subtle bg-white px-4 py-2.5">
          <span className="h-2 w-2 shrink-0 rounded-full bg-accent-mustard" />
          <p className="text-xs text-text-muted">
            Viewing a saved research — this is a read-only replay, no new API calls are made.
          </p>
          <Link
            href="/analyze"
            className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-widest text-accent-orange transition-colors hover:underline"
          >
            Run new →
          </Link>
        </div>

        <ResearchView
          company={entry.company}
          thesis={entry.thesis}
          savedLegs={entry.legs}
        />
      </main>

      <FloatingBadge />
    </div>
  );
}

function NavBar() {
  return (
    <nav className="sticky top-0 z-20 flex items-center justify-between border-b border-border-subtle bg-bg-cream/85 px-6 py-5 backdrop-blur-sm">
      <Link href="/" className="flex items-center gap-2.5">
        <PixelMark />
        <span className="text-lg font-bold tracking-tight">Dilligent</span>
      </Link>
      <div className="flex items-center gap-5">
        <Link
          href="/history"
          className="font-mono text-xs uppercase tracking-widest text-text-muted transition-colors hover:text-text-primary"
        >
          Past Researches
        </Link>
      </div>
    </nav>
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
