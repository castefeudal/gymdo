import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
test.use({ serviceWorkers: 'block' });

async function frameDigest(image) {
  return createHash('sha256').update(await image.screenshot({ animations: 'allow' })).digest('hex');
}

test('exercise GIFs animate on visible touch cards and pointer or keyboard focus, then respect reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/index.html#library');
  await expect(page.locator('#mmg-boot')).toHaveCount(0);
  const card = page.locator('#grid .card').first();
  const image = card.locator('.card-media img');
  const touch = await page.evaluate(() => matchMedia('(hover: none), (pointer: coarse)').matches);

  if (touch) {
    await card.evaluate(node => node.scrollIntoView({ block: 'center' }));
  } else {
    await card.hover();
  }
  await expect(image).toHaveAttribute('data-motion', '1');
  await expect(image).toHaveAttribute('src', /videos\/.*\.gif/);
  await image.evaluate(img => img.decode());
  const firstFrame = await frameDigest(image);
  await expect.poll(() => frameDigest(image), { timeout: 6000, intervals: [150, 300, 500] }).not.toBe(firstFrame);

  if (touch) {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect(image).toHaveAttribute('data-motion', '0');
  } else {
    await page.locator('#search').hover();
    await expect(image).toHaveAttribute('data-motion', '0');
  }
  await expect(image).toHaveAttribute('src', /images\/.*\.jpg/);

  if (!touch) {
    await card.locator('[data-open]').focus();
    await expect(image).toHaveAttribute('data-motion', '1');
    await page.locator('#search').focus();
    await expect(image).toHaveAttribute('data-motion', '0');
    await expect(image).toHaveAttribute('src', /images\/.*\.jpg/);
  }

  await page.emulateMedia({ reducedMotion: 'reduce' });
  if (touch) await card.evaluate(node => node.scrollIntoView({ block: 'center' }));
  else await card.hover();
  await expect(image).toHaveAttribute('src', /images\/.*\.jpg/);
  await expect(image).toHaveAttribute('data-motion', '0');
});
