// Types for the morning digest (plan.md § 1). The reader itself lives in read.ts.

export type RunStatus = 'ok' | 'retry' | 'fail';

// One row per job for one night.
export type DigestRow = {
  job: string;
  owner: string | null; // null is kept; views show it as —
  runs: number; // log lines for this job
  retries: number; // lines with status "retry"
  lastStatus: RunStatus; // status of the job's newest line
  lastError: string | null; // the job's newest error, null if none
  firstAt: string; // earliest `at`, offset kept as in the log
  lastAt: string; // latest `at`, offset kept as in the log
};

// What readNight returns for a night whose file exists.
export type NightResult = {
  night: string;
  rows: DigestRow[];
  badLines: number; // lines that did not parse; counted, never thrown
};

// Reads `<runsDir>/<night>.jsonl`.
// Returns null when there is no file for the night (404 upstream).
// An empty file gives `{ rows: [], badLines: 0 }`.
export type ReadNight = (runsDir: string, night: string) => NightResult | null;
