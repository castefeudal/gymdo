import { test, expect } from '@playwright/test';
test('compiled shell and unvisited routes reopen offline without authored bundle duplicates', async ({ page, context }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/index.html#home', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#mmg-boot')).toHaveCount(0);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise(resolve => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
  });
  const files = await page.evaluate(async () => {
    const names = await caches.keys();
    const shell = await caches.open(names.find(name => name.includes('shell-')));
    return (await shell.keys()).map(request => new URL(request.url).pathname);
  });
  expect(files.some(file => file.endsWith('/assets/runtime/application.js'))).toBe(true);
  expect(files.some(file => file.endsWith('/app.js'))).toBe(false);
  // A genuinely unreachable origin exercises the service-worker fallback in
  // every engine. WebKit's protocol offline flag can abort before fetch events.
  await context.addCookies([{ name: 'mmg-offline-test', value: '1', url: page.url() }]);
  expect(await page.evaluate(async () => {
    try { await fetch('/uncached-offline-probe', { cache: 'no-store' }); return false; }
    catch { return true; }
  })).toBe(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator('#mmg-boot')).toHaveCount(0);
  for (const route of ['labs', 'tools', 'library', 'workout', 'program', 'nutrition', 'progress', 'settings']) {
    await page.evaluate(route => { location.hash = route; }, route);
    await expect(page.locator('html')).toHaveAttribute('data-route-ready', route);
    if (route === 'labs') await expect(page.locator('.lab-result-form')).toBeVisible();
    if (route === 'tools') await expect(page.locator('[data-lab-form]').first()).toBeVisible();
    if (route === 'library') await expect(page.locator('#grid .card').first()).toBeVisible();
  }
  expect(errors).toEqual([]);
});
