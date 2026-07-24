'use client';

import { useState } from 'react';

interface FounderCandidate {
  name: string;
  title: string;
  sourceUrl: string;
}

interface DiscoverResponse {
  founders: FounderCandidate[];
  error?: string;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

interface FounderDiscoveryProps {
  companyName: string;
  website: string;
  onChange: (founders: string[]) => void;
}

export default function FounderDiscovery({ companyName, website, onChange }: FounderDiscoveryProps) {
  const [status, setStatus] = useState<Status>('idle');
  const [candidates, setCandidates] = useState<(FounderCandidate & { selected: boolean })[]>([]);
  const [manualFounders, setManualFounders] = useState<string[]>([]);
  const [manualName, setManualName] = useState('');
  const [error, setError] = useState('');

  const canSearch = companyName.trim().length > 0 && website.trim().length > 0;

  function emitChange(current: (FounderCandidate & { selected: boolean })[], manual: string[]) {
    onChange([...current.filter((c) => c.selected).map((c) => c.name), ...manual]);
  }

  async function handleFind() {
    setStatus('loading');
    setError('');
    try {
      const res = await fetch('/api/founders/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: companyName, website }),
      });
      const data = (await res.json()) as DiscoverResponse;
      if (!res.ok || data.error) {
        setStatus('error');
        setError(data.error ?? 'Could not find founders.');
        return;
      }
      const withSelection = data.founders.map((f) => ({ ...f, selected: true }));
      setCandidates(withSelection);
      setStatus('done');
      emitChange(withSelection, manualFounders);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Network error.');
    }
  }

  function toggle(index: number) {
    const next = candidates.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c));
    setCandidates(next);
    emitChange(next, manualFounders);
  }

  function addManual() {
    const name = manualName.trim();
    if (!name) return;
    const next = [...manualFounders, name];
    setManualFounders(next);
    setManualName('');
    emitChange(candidates, next);
  }

  function removeManual(index: number) {
    const next = manualFounders.filter((_, i) => i !== index);
    setManualFounders(next);
    emitChange(candidates, next);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-neutral-700">Founders</span>
        {status !== 'loading' && (
          <button
            type="button"
            onClick={handleFind}
            disabled={!canSearch}
            className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium disabled:opacity-40"
          >
            {status === 'done' ? 'Search again' : 'Find founders'}
          </button>
        )}
        {status === 'loading' && <span className="text-sm text-neutral-500">Searching...</span>}
      </div>

      {status === 'error' && <p className="text-sm text-red-600">{error}</p>}

      {candidates.length > 0 && (
        <ul className="space-y-2">
          {candidates.map((c, i) => (
            <li key={i} className="flex items-center gap-3 rounded-md border border-neutral-200 px-3 py-2">
              <input type="checkbox" checked={c.selected} onChange={() => toggle(i)} />
              <div className="flex-1">
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-neutral-500">{c.title}</p>
              </div>
              {c.sourceUrl && (
                <a href={c.sourceUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                  verify
                </a>
              )}
            </li>
          ))}
        </ul>
      )}

      {manualFounders.length > 0 && (
        <ul className="space-y-2">
          {manualFounders.map((name, i) => (
            <li key={i} className="flex items-center gap-3 rounded-md border border-neutral-200 px-3 py-2">
              <span className="flex-1 text-sm font-medium">{name}</span>
              <button type="button" onClick={() => removeManual(i)} className="text-xs text-neutral-500 hover:underline">
                remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          value={manualName}
          onChange={(e) => setManualName(e.target.value)}
          placeholder="Add a founder not listed above"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm"
        />
        <button type="button" onClick={addManual} className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm">
          Add
        </button>
      </div>
    </div>
  );
}
