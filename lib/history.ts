import type { CompanyInput, LegResult, Memo, SavedResearch, ThesisConfig } from './types';

const STORAGE_KEY = 'dilligent:history';
const MAX_ENTRIES = 50;

function readRaw(): SavedResearch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedResearch[];
  } catch {
    // Corrupt data — return empty rather than crashing
    return [];
  }
}

function writeRaw(entries: SavedResearch[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    // Storage quota exceeded or other write error — surface to caller
    throw err;
  }
}

/** Returns all saved research entries, newest first. */
export function loadHistory(): SavedResearch[] {
  return readRaw();
}

/** Saves a completed research run and returns the persisted entry. */
export function saveResearch(
  data: Omit<SavedResearch, 'id' | 'savedAt'>
): SavedResearch {
  const entry: SavedResearch = {
    ...data,
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
  };

  const existing = readRaw();
  // Newest first; cap at MAX_ENTRIES
  const updated = [entry, ...existing].slice(0, MAX_ENTRIES);
  writeRaw(updated);
  return entry;
}

/** Removes a single saved research entry by id. */
export function deleteResearch(id: string): void {
  const updated = readRaw().filter((e) => e.id !== id);
  writeRaw(updated);
}

/** Removes all saved research entries. */
export function clearHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Looks up a single entry by id. Returns null if not found. */
export function getResearch(id: string): SavedResearch | null {
  return readRaw().find((e) => e.id === id) ?? null;
}
