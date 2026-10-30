import { sortRows } from '../digest/sort.js';
import type { NightResult } from '../digest/types.js';

const dash = '—';

export function DigestPage({ result }: { result: NightResult }) {
  const rows = sortRows(result.rows);
  return (
    <>
      <h1>digest · {result.night}</h1>
      {rows.length === 0 ? (
        <p class="mute">nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th><th>owner</th><th>runs</th><th>retries</th><th>last status</th><th>last error</th><th>first</th><th>last</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr class={r.retries >= 3 || r.lastStatus === 'fail' ? 'warn' : undefined}>
                <td>{r.job}</td>
                <td>{r.owner ?? dash}</td>
                <td>{r.runs}</td>
                <td>{r.retries}</td>
                <td>{r.lastStatus}</td>
                <td>{r.lastError ?? dash}</td>
                <td>{r.firstAt}</td>
                <td>{r.lastAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {result.badLines > 0 ? <p class="mute">{result.badLines} bad {result.badLines === 1 ? 'line' : 'lines'} skipped</p> : null}
    </>
  );
}
