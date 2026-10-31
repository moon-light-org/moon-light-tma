import assert from 'node:assert/strict';
import { httpJson, HttpError } from '../.tmp-tests/api/http.js';

const originalFetch = globalThis.fetch;
globalThis.window = { setTimeout, clearTimeout };
try {
  let aborted = false;
  globalThis.fetch = (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener('abort', () => {
      aborted = true;
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
  await assert.rejects(httpJson('/api/users/me', { timeoutMs: 10 }), error => error instanceof HttpError && error.status === 408);
  assert.equal(aborted, true, 'A hung profile request must actually be aborted');

  globalThis.fetch = async () => new Response(JSON.stringify({ id: 1 }), { status: 200 });
  assert.deepEqual(await httpJson('/api/users/me', { timeoutMs: 100 }), { id: 1 });

  let appended = 0;
  let expire;
  const script = {};
  window.setTimeout = callback => { expire = callback; return 1; };
  window.clearTimeout = () => {};
  globalThis.document = { createElement: () => script, head: { appendChild: () => { appended++; } } };
  const { loadTelegramWebApp } = await import('../.tmp-tests/telegram/webAppSdk.js');
  const sdk = loadTelegramWebApp();
  assert.equal(script.async, true, 'The native bridge must not block startup');
  assert.equal(loadTelegramWebApp(), sdk, 'Location and startup must share one bridge load');
  expire();
  assert.equal(await sdk, false, 'An unreachable SDK must release location callers');
  assert.equal(appended, 1);
  let ready = 0;
  window.Telegram = { WebApp: { ready: () => ready++ } };
  script.onload();
  assert.equal(ready, 1, 'A late SDK should still dismiss the Telegram placeholder');
  assert.equal(await loadTelegramWebApp(), true, 'Location must recover after the SDK arrives late');
  console.log('Startup recovery tests passed');
} finally {
  globalThis.fetch = originalFetch;
  delete globalThis.window;
  delete globalThis.document;
}
