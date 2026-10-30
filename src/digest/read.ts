import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestRow, NightResult, ReadNight, RunStatus } from './types.js';

type RunLine = {
  at: string;
  time: number; // parsed `at`, only for ordering; `at` itself is kept as written
  job: string;
  status: RunStatus;
  owner: string | null;
  error: string | null;
};

const NIGHT = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES: readonly string[] = ['ok', 'retry', 'fail'];

// Parse one log line at the edge. Anything that isn't a well-formed run line is null.
function parseLine(text: string): RunLine | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;
  const o = value as Record<string, unknown>;
  if (typeof o.at !== 'string' || typeof o.job !== 'string' || o.job === '') return null;
  if (typeof o.status !== 'string' || !STATUSES.includes(o.status)) return null;
  if (o.owner !== null && typeof o.owner !== 'string') return null;
  if (o.error !== undefined && o.error !== null && typeof o.error !== 'string') return null;
  const time = Date.parse(o.at);
  if (Number.isNaN(time)) return null;
  return {
    at: o.at,
    time,
    job: o.job,
    status: o.status as RunStatus,
    owner: o.owner,
    error: typeof o.error === 'string' ? o.error : null,
  };
}

function toRow(lines: RunLine[]): DigestRow {
  // Oldest first; equal times keep file order, so the later line counts as newer.
  const sorted = [...lines].sort((a, b) => a.time - b.time);
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  const lastWithError = [...sorted].reverse().find((l) => l.error !== null);
  return {
    job: last.job,
    owner: last.owner,
    runs: sorted.length,
    retries: sorted.filter((l) => l.status === 'retry').length,
    lastStatus: last.status,
    lastError: lastWithError?.error ?? null,
    firstAt: first.at,
    lastAt: last.at,
  };
}

export const readNight: ReadNight = (runsDir, night) => {
  if (!NIGHT.test(night)) return null;
  let text: string;
  try {
    text = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }

  const byJob = new Map<string, RunLine[]>();
  let badLines = 0;
  for (const raw of text.split('\n')) {
    if (raw.trim() === '') continue;
    const line = parseLine(raw);
    if (line === null) {
      badLines++;
      continue;
    }
    const list = byJob.get(line.job);
    if (list) list.push(line);
    else byJob.set(line.job, [line]);
  }

  const rows = [...byJob.values()].map(toRow).sort((a, b) => (a.job < b.job ? -1 : a.job > b.job ? 1 : 0));
  const result: NightResult = { night, rows, badLines };
  return result;
};
