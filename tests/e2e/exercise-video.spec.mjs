import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test.use({ serviceWorkers: 'block' });

test('licensed video is lazy, exposes speed, falls back and closes safely', async ({ page, browserName }) => {
  await page.route('**/data/exercise-media.json', route => route.fulfill({ json: {
    schemaVersion: 1, exercises: { '0025': {
      author: 'Test owner', license: 'Test permission', attributionUrl: 'https://example.org/credit',
      sources: [{ src: 'videos/test-missing.mp4', type: 'video/mp4', width: 1920, height: 1080 }]
    } }
  } }));
  let videoRequests = 0;
  await page.route('**/videos/test-missing.mp4', route => { videoRequests++; return route.abort(); });
  await page.goto('/index.html#library');
  await expect(page.locator('#mmg-boot')).toHaveCount(0);
  await expect(page.locator('#grid .card img').first()).toHaveAttribute('loading', 'eager');
  await expect(page.locator('#grid .card img').first()).toHaveAttribute('fetchpriority', 'high');
  await expect(page.locator('#grid .card img').nth(1)).toHaveAttribute('loading', 'lazy');
  await page.locator('#search').fill('0025');
  await page.locator('#grid [data-open="0025"]').click();
  const video = page.locator('#modal video');
  if (browserName === 'webkit') {
    // Windows WebKit may reject the codec before playback, even with preload
    // disabled. That browser must still retain the usable GIF fallback.
    await expect(page.locator('#modal-media-status')).toHaveText(/^Видео(?: недоступно · GIF)?$/);
    await page.locator('#modal-media').click();
    await page.evaluate(() => { document.querySelector('#modal video')?.play().catch(() => {}); });
    await expect(page.locator('#modal-media-status')).toContainText('Видео недоступно');
    await expect(page.locator('#modal-img')).toBeVisible();
    await page.locator('#modal-close').click();
    await expect(video).toHaveCount(0);
    return;
  }
  await expect(video).toHaveCount(1);
  await expect(video).toHaveAttribute('preload', 'none');
  expect(videoRequests).toBe(0);
  await expect(page.locator('#modal-media-status')).not.toContainText('Full HD');
  await page.getByRole('combobox', { name: 'Скорость воспроизведения' }).selectOption('0.5');
  expect(await video.evaluate(element => element.playbackRate)).toBe(0.5);
  await page.getByRole('button', { name: 'Сначала', exact: true }).click();
  await expect(video).toHaveCount(0);
  await expect(page.locator('#modal-img')).toBeVisible();
  await expect(page.locator('#modal-media-status')).toContainText('Видео недоступно');
  await page.locator('#modal-close').click();
  await expect(page.locator('#modal')).toHaveAttribute('data-open', 'false');
});

test('decoded dimensions remain honest and closing releases a playable source', async ({ page, browserName }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/data/exercise-media.json', route => route.fulfill({ json: { exercises: { '0025': {
    author: 'Synthetic test fixture', license: 'CC0 test-only color frame', attributionUrl: 'https://example.org/test-fixture',
    sources: [{ src: 'videos/player-test.webm', type: 'video/webm', width: 1920, height: 1080 }]
  } } } }));
  const bytes = await readFile(new URL('../fixtures/player-test.webm', import.meta.url));
  await page.route('**/videos/player-test.webm', route => route.fulfill({ body: bytes, contentType: 'video/webm' }));
  await page.goto('/index.html#library');
  await expect(page.locator('#mmg-boot')).toHaveCount(0);
  await page.locator('#search').fill('0025');
  await page.locator('#grid [data-open="0025"]').click();
  const video = page.locator('#modal video');
  if (browserName === 'webkit') {
    await expect(page.locator('#modal-media-status')).toHaveText(/^Видео(?: недоступно · GIF)?$|160 × 90/);
    await page.locator('#modal-media').click();
    await page.evaluate(() => { document.querySelector('#modal video')?.play().catch(() => {}); });
    await expect(page.locator('#modal-media-status')).toHaveText(/160 × 90|Видео недоступно · GIF/);
    if (await video.count()) expect(await video.evaluate(element => element.videoWidth)).toBe(160);
    else await expect(page.locator('#modal-img')).toBeVisible();
  } else {
    await expect(video).toHaveCount(1);
    await page.getByRole('button', { name: 'Сначала', exact: true }).click();
    await expect(page.locator('#modal-media-status')).toHaveText('160 × 90');
    expect(await video.evaluate(element => element.videoWidth)).toBe(160);
  }
  const stale = await video.count() ? await video.elementHandle() : null;
  await page.locator('#modal-close').click();
  await expect(video).toHaveCount(0);
  if (stale) await stale.evaluate(element => element.dispatchEvent(new Event('loadedmetadata')));
  await page.evaluate(() => new Promise(requestAnimationFrame));
  expect(errors).toEqual([]);
});
