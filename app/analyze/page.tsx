'use client';

import { useState } from 'react';
import InputForm from '@/components/InputForm';
import ResearchView from '@/components/ResearchView';
import PixelMark from '@/components/PixelMark';
import type { CompanyInput, ThesisConfig } from '@/lib/types';

type PageState = 'input' | 'running';

const SHELL_CLASSES: Record<PageState, string> = {
  input: 'bg-bg-cream text-text-primary',
  running: 'bg-bg-cream text-text-primary',
};

export default function AnalyzePage() {
  const [pageState, setPageState] = useState<PageState>('input');
  const [company, setCompany] = useState<CompanyInput | null>(null);
  const [thesis, setThesis] = useState<ThesisConfig | null>(null);

  function handleSubmit(company: CompanyInput, thesis: ThesisConfig) {
    setCompany(company);
    setThesis(thesis);
    setPageState('running');
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 ${SHELL_CLASSES[pageState]}`}>
      <nav className="flex items-center justify-between border-b border-border-subtle/30 px-6 py-5">
        <div className="flex items-center gap-2.5">
          <PixelMark />
          <span className="text-lg font-bold tracking-tight">Dilligent</span>
        </div>
          <a
            href="/history"
            className="font-mono text-xs uppercase tracking-widest text-text-muted transition-colors hover:text-text-primary"
          >
            Past Researches
          </a>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {pageState === 'input' && <InputForm onSubmit={handleSubmit} />}
        {pageState === 'running' && company && thesis && <ResearchView company={company} thesis={thesis} />}
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
