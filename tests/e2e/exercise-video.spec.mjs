import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
test.use({ serviceWorkers: 'block' });

test('library previews fit their frames and pagination retains the complete catalog',async({page})=>{
  await page.setViewportSize({width:320,height:844});
  await page.goto('/index.html#library');await expect(page.locator('#mmg-boot')).toHaveCount(0);
  await expect(page.locator('#grid .card')).toHaveCount(12);
  const image=page.locator('#grid .card-media img').first();await image.evaluate(img=>img.decode());
  const bounds=await image.evaluate(img=>{const frame=img.parentElement.getBoundingClientRect(),box=img.getBoundingClientRect();return {fit:getComputedStyle(img).objectFit,inside:box.top>=frame.top&&box.bottom<=frame.bottom&&box.left>=frame.left&&box.right<=frame.right,natural:img.naturalHeight};});
  expect(bounds.fit).toBe('contain');expect(bounds.inside).toBe(true);expect(bounds.natural).toBeGreaterThan(0);
  await page.locator('#load-more').click();await expect(page.locator('#grid .card')).toHaveCount(24);await expect(page.locator('#results-count')).toContainText('1324');
});

test('instruction loading opens an immediate closable dialog and never reopens after Escape',async({page})=>{
  await page.route('**/data/exercise-details.json',async route=>{const response=await route.fetch();await new Promise(resolve=>setTimeout(resolve,400));await route.fulfill({response});});
  await page.goto('/index.html#library');await expect(page.locator('#mmg-boot')).toHaveCount(0);
  const done=page.waitForResponse('**/data/exercise-details.json');
  await page.locator('#grid [data-open]').first().click();
  await expect(page.locator('#modal')).toHaveAttribute('data-open','true');
  await page.keyboard.press('Escape');await expect(page.locator('#modal')).toHaveAttribute('data-open','false');
  await done;await page.evaluate(()=>new Promise(requestAnimationFrame));await expect(page.locator('#modal')).toHaveAttribute('data-open','false');
});

test('exercise detail GIF autoplays and has no redundant play or pause control', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/index.html#library');
  await expect(page.locator('#mmg-boot')).toHaveCount(0);
  await page.locator('#search').fill('0025');
  await page.locator('#grid [data-open="0025"]').click();
  await expect(page.locator('#modal')).toBeVisible();
  await expect(page.locator('#modal-scroll')).toBeVisible();
  const image = page.locator('#modal-img');
  await expect(image).toHaveAttribute('src', /videos\/.*\.gif/);
  await expect(page.locator('#modal-media-play')).toHaveCount(0);
});

test('exercise technique tabs hide while scrolling down and return while scrolling up or at the top', async ({ page }) => {
  await page.goto('/index.html#library');
  await expect(page.locator('#mmg-boot')).toHaveCount(0);
  await page.locator('#grid [data-open]').first().click();
  const scroll = page.locator('#modal-scroll');
  const tabs = page.locator('#modal-tabs');
  await expect(tabs).toBeVisible();
  await scroll.evaluate(element => { element.style.scrollBehavior = 'auto'; element.scrollTop = 420; });
  await expect(tabs).toHaveClass(/is-scroll-hidden/);
  await expect(tabs).toHaveJSProperty('inert', true);
  await scroll.evaluate(element => { element.scrollTop = 180; });
  await expect(tabs).not.toHaveClass(/is-scroll-hidden/);
  await expect(tabs).toHaveJSProperty('inert', false);
  await scroll.evaluate(element => { element.scrollTop = 420; });
  await expect(tabs).toHaveClass(/is-scroll-hidden/);
  await scroll.evaluate(element => { element.scrollTop = 0; });
  await expect(tabs).not.toHaveClass(/is-scroll-hidden/);
});

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
