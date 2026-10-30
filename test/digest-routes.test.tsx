import { copyFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

let dir: string;
let app: ReturnType<typeof createApp>;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), 'rig-digest-'));
  copyFileSync('runs/2026-10-28.jsonl', join(dir, '2026-10-28.jsonl'));
  writeFileSync(join(dir, '2026-10-20.jsonl'), '');
  writeFileSync(
    join(dir, '2026-10-21.jsonl'),
    '{"at":"2026-10-21T01:00:00+01:00","job":"lane/sync","status":"ok","owner":"rook"}\nnot json\n',
  );
  app = createApp({ adapter: 'shim', installed: '2026-10-29T14:06:00+01:00', beatEverySeconds: 60, runsDir: dir });
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

type Api = { night: string; rows: { job: string }[]; badLines: number };
const api = async (night: string) => (await app.request(`/api/digest/${night}`)).json() as Promise<Api>;

describe('digest page', () => {
  it('200 for an existing night', async () => {
    const res = await app.request('/digest/2026-10-28');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('lane/sync');
  });
  it('404 for a night with no file', async () => {
    expect((await app.request('/digest/2026-01-01')).status).toBe(404);
  });
  it('empty night says nothing ran', async () => {
    const res = await app.request('/digest/2026-10-20');
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('nothing ran');
  });
  it('bad line still renders', async () => {
    const res = await app.request('/digest/2026-10-21');
    const html = await res.text();
    expect(res.status).toBe(200);
    expect(html).toContain('lane/sync');
    expect(html).toContain('1 bad line skipped');
  });
});

describe('digest JSON', () => {
  it('200 for an existing night', async () => {
    const res = await app.request('/api/digest/2026-10-28');
    expect(res.status).toBe(200);
    const body = await api('2026-10-28');
    expect(body.night).toBe('2026-10-28');
    expect(body.rows.length).toBeGreaterThan(0);
  });
  it('404 for a night with no file', async () => {
    expect((await app.request('/api/digest/2026-01-01')).status).toBe(404);
  });
  it('empty night has zero rows', async () => {
    const res = await app.request('/api/digest/2026-10-20');
    expect(res.status).toBe(200);
    expect(await api('2026-10-20')).toMatchObject({ rows: [], badLines: 0 });
  });
  it('bad line renders with badLines 1', async () => {
    const res = await app.request('/api/digest/2026-10-21');
    expect(res.status).toBe(200);
    const body = await api('2026-10-21');
    expect(body.badLines).toBe(1);
    expect(body.rows).toHaveLength(1);
  });
});

describe('page and JSON agree', () => {
  it('list the same jobs in the same order', async () => {
    const html = await (await app.request('/digest/2026-10-28')).text();
    const pageJobs = [...html.matchAll(/<tbody>[\s\S]*?<\/tbody>/g)][0][0]
      .split('<tr').slice(1)
      .map((tr) => /<td>([^<]*)<\/td>/.exec(tr)![1]);
    const jsonJobs = (await api('2026-10-28')).rows.map((r) => r.job);
    expect(pageJobs).toEqual(jsonJobs);
  });
});
