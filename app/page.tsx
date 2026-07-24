'use client';

import { useState } from 'react';
import InputForm from '@/components/InputForm';
import ResearchProgress from '@/components/ResearchProgress';
import MemoView from '@/components/MemoView';
import { buildMemo } from '@/lib/scoring';
import type { CompanyInput, LegResult, Memo, ThesisConfig } from '@/lib/types';

type PageState = 'input' | 'running' | 'done';

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
    <main className="mx-auto max-w-3xl px-6 py-12">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold">Dilligent</h1>
        <p className="text-neutral-500">AI VC analyst -- citation-backed, thesis-relative investment memos.</p>
      </header>

      {pageState === 'input' && <InputForm onSubmit={handleSubmit} />}
      {pageState === 'running' && company && thesis && (
        <ResearchProgress company={company} thesis={thesis} onComplete={handleComplete} />
      )}
      {pageState === 'done' && memo && <MemoView memo={memo} />}
    </main>
  );
}
