import type { DigestRow } from './types.js';

// Shared order for the page and the JSON route: by job, plain code-unit order, stable.
export function sortRows(rows: DigestRow[]): DigestRow[] {
  return [...rows].sort((a, b) => (a.job < b.job ? -1 : a.job > b.job ? 1 : 0));
}
