'use client';

import { useState } from 'react';
import InputForm from '@/components/InputForm';
import ResearchProgress from '@/components/ResearchProgress';
import MemoView from '@/components/MemoView';
import PixelMark from '@/components/PixelMark';
import { buildMemo } from '@/lib/scoring';
import type { CompanyInput, LegResult, Memo, ThesisConfig } from '@/lib/types';

type PageState = 'input' | 'running' | 'done';

const SHELL_CLASSES: Record<PageState, string> = {
  input: 'bg-bg-cream text-text-primary',
  running: 'bg-bg-dark text-text-on-dark',
  done: 'bg-bg-cream text-text-primary',
};

export default function Home() {
  const [pageState, setPageState] = useState<PageState>('input');
  const [company, setCompany] = useState<CompanyInput | null>(null);
  const [thesis, setThesis] = useState<ThesisConfig | null>(null);
  const [memo, setMemo] = useState<Memo | null>(null);

  function handleSubmit(company: CompanyInput, thesis: ThesisConfig) {
    setCompany(company);
    setThesis(thesis);
    setPageState('running');
  }

  function handleComplete(legs: LegResult[]) {
    if (!company || !thesis) return;
    setMemo(buildMemo(company, thesis, legs));
    setPageState('done');
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${SHELL_CLASSES[pageState]}`}>
      <nav className="flex items-center justify-between border-b border-border-subtle/30 px-6 py-5">
        <div className="flex items-center gap-2.5">
          <PixelMark />
          <span className="text-lg font-bold tracking-tight">Dilligent</span>
        </div>
        <span className="font-mono text-xs uppercase tracking-widest opacity-50">
          AI VC Analyst
        </span>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {pageState === 'input' && <InputForm onSubmit={handleSubmit} />}
        {pageState === 'running' && company && thesis && (
          <ResearchProgress company={company} thesis={thesis} onComplete={handleComplete} />
        )}
        {pageState === 'done' && memo && <MemoView memo={memo} />}
      </main>

      <FloatingBadge />
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
