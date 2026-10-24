import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { setImmediate } from 'node:timers/promises';

async function harness(fetch) {
  const cached = new Response('installed shell');
  const timers = [], cleared = [];
  const context = {
    Response, fetch,
    self: { navigator: { onLine: true }, addEventListener() {} },
    caches: { match: async () => cached, open: async () => { throw new Error('Cache write unavailable'); } },
    setTimeout(callback, delay) { timers.push({ callback, delay }); return timers.length; },
    clearTimeout(id) { cleared.push(id); },
  };
  runInNewContext(await readFile(new URL('../src/app/service-worker.js', import.meta.url), 'utf8'), context);
  return { context, cached, timers, cleared };
}

test('installed shell responds within its deadline when network fetch never settles', async () => {
  const { context, cached, timers, cleared } = await harness(() => new Promise(() => {}));
  const pending = context.shellResponse({ url: 'https://example.test/index.html' });
  await setImmediate();
  assert.equal(timers[0].delay, 3000);
  timers[0].callback();
  const result = await pending;
  assert.equal(result.response, cached);
  assert.equal(result.fromCache, true);
  assert.deepEqual(cleared, [1]);
});

test('rejected requests retain the installed shell and clear their deadline', async () => {
  const { context, cached, cleared } = await harness(async () => { throw new Error('Connection lost'); });
  const result = await context.shellResponse({ url: 'https://example.test/ui.html' });
  assert.equal(result.response, cached);
  assert.equal(result.fromCache, true);
  assert.deepEqual(cleared, [1]);
});

test('a cache write failure does not discard a valid online navigation response', async () => {
  const fresh = new Response('fresh shell');
  const { context, cleared } = await harness(async () => fresh);
  assert.equal(await context.networkFirstNavigation({ url: 'https://example.test/index.html' }), fresh);
  assert.deepEqual(cleared, [1]);
});
