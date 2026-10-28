import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
test.use({ serviceWorkers: 'block' });

async function frameDigest(image) {
  return createHash('sha256').update(await image.screenshot({ animations: 'allow' })).digest('hex');
}

test('exercise GIFs autoplay on visible cards on every device and do not need hover, focus, or a play control', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/index.html#library');
  await expect(page.locator('#mmg-boot')).toHaveCount(0);
  const card = page.locator('#grid .card').first();
  const image = card.locator('.card-media img');
  await card.evaluate(node => node.scrollIntoView({ block: 'center' }));
  await expect(image).toHaveAttribute('data-motion', '1');
  await expect(image).toHaveAttribute('src', /videos\/.*\.gif/);
  await image.evaluate(img => img.decode());
  const firstFrame = await frameDigest(image);
  await expect.poll(() => frameDigest(image), { timeout: 6000, intervals: [150, 300, 500] }).not.toBe(firstFrame);

  await page.locator('#search').hover();
  await expect(image).toHaveAttribute('data-motion', '1');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(image).toHaveAttribute('data-motion', '1');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(image).toHaveAttribute('data-motion', '0');
  await card.evaluate(node => node.scrollIntoView({ block: 'center' }));
  await expect(image).toHaveAttribute('data-motion', '1');
});
