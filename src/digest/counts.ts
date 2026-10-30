import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RunStatus } from './types.js';

export type NightCounts = Record<RunStatus, number>;

// Counts log lines per status. Lines that don't parse or have an unknown status are skipped.
export function countStatuses(text: string): NightCounts {
  const counts: NightCounts = { ok: 0, retry: 0, fail: 0 };
  for (const line of text.split('\n')) {
    if (!line.trim()) continue;
    try {
      const s = (JSON.parse(line) as { status?: unknown }).status;
      if (s === 'ok' || s === 'retry' || s === 'fail') counts[s]++;
    } catch {
      // bad line: not counted
    }
  }
  return counts;
}

export function readCounts(runsDir: string, night: string): NightCounts | null {
  try {
    return countStatuses(readFileSync(join(runsDir, `${night}.jsonl`), 'utf8'));
  } catch {
    return null;
  }
}
