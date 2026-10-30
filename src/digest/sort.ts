export function sortRows<T extends { job: string }>(rows: T[]): T[] { return [...rows].sort((a, b) => (a.job < b.job ? -1 : a.job > b.job ? 1 : 0)); }
