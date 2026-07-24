'use client';

import { useState } from 'react';
import type { CompanyInput, RiskAppetite, Sector, Stage, ThesisConfig } from '@/lib/types';
import FounderDiscovery from './FounderDiscovery';
import Button from './Button';
import Eyebrow from './Eyebrow';

const STAGES: Stage[] = ['Pre-seed', 'Seed', 'Series A'];
const SECTORS: Sector[] = ['Fintech', 'AI-Dev-Tools', 'Consumer', 'Healthcare', 'Other'];
const RISK_APPETITES: RiskAppetite[] = ['Conservative', 'Balanced', 'Aggressive'];

const inputClass =
  'w-full rounded-[10px] border border-border-subtle bg-white px-3 py-2.5 text-sm text-text-primary outline-none focus:border-text-primary';

interface InputFormProps {
  onSubmit: (company: CompanyInput, thesis: ThesisConfig) => void;
}

export default function InputForm({ onSubmit }: InputFormProps) {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [founders, setFounders] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>('Seed');
  const [sector, setSector] = useState<Sector>('Fintech');
  const [checkSize, setCheckSize] = useState(1_000_000);
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite>('Balanced');

  const canSubmit = name.trim().length > 0 && website.trim().length > 0 && founders.length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    const company: CompanyInput = {
      name: name.trim(),
      website: website.trim(),
      founders,
    };
    const thesis: ThesisConfig = { stage, sector, checkSize, riskAppetite };
    onSubmit(company, thesis);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div className="rounded-2xl border border-border-subtle bg-white p-6 space-y-5">
        <Eyebrow>Company</Eyebrow>
        <Field label="Company name">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Company website">
          <input
            required
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            className={inputClass}
          />
        </Field>
        <FounderDiscovery companyName={name} website={website} onChange={setFounders} />
      </div>

      <div className="rounded-2xl border border-border-subtle bg-white p-6 space-y-5">
        <Eyebrow>Investment thesis</Eyebrow>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Stage">
            <select value={stage} onChange={(e) => setStage(e.target.value as Stage)} className={inputClass}>
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sector">
            <select value={sector} onChange={(e) => setSector(e.target.value as Sector)} className={inputClass}>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Check size ($${checkSize.toLocaleString()})`}>
            <input
              type="range"
              min={100_000}
              max={10_000_000}
              step={100_000}
              value={checkSize}
              onChange={(e) => setCheckSize(Number(e.target.value))}
              className="w-full accent-accent-orange"
            />
          </Field>
          <Field label="Risk appetite">
            <select
              value={riskAppetite}
              onChange={(e) => setRiskAppetite(e.target.value as RiskAppetite)}
              className={inputClass}
            >
              {RISK_APPETITES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      <div className="space-y-2">
        <Button type="submit" disabled={!canSubmit}>
          Run research
        </Button>
        {!canSubmit && founders.length === 0 && name.trim() && website.trim() && (
          <p className="font-mono text-xs text-text-muted">Find and confirm at least one founder to continue.</p>
        )}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="font-mono text-xs uppercase tracking-wider text-text-muted">{label}</span>
      {children}
    </label>
  );
}
