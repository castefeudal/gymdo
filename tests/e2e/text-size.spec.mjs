import { test, expect } from '@playwright/test';
test.use({ serviceWorkers: 'block' });
async function openSettings(page) {
  await page.goto('/index.html#settings');
  await expect(page.locator('html')).toHaveAttribute('data-app-ready', 'true');
  await expect(page.locator('html')).toHaveAttribute('data-route-ready', 'settings');
}
for (const width of [320, 390, 768, 1440]) {
  test(`text sizes persist and reflow at ${width}px`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height: 900 });
    await openSettings(page);
    await expect(page.locator('html')).toHaveAttribute('data-route-ready', 'settings');
    await expect(page.locator('#v10-reading-title')).toHaveText('Размер текста');
    const sizes = [];
    for (const [mode, label] of [['small', 'Мелко'], ['balanced', 'Средне'], ['large', 'Крупно']]) {
      await page.locator(`[data-v10-reading="${mode}"]`).click();
      await expect(page.locator(`[data-v10-reading="${mode}"]`)).toHaveAttribute('aria-pressed', 'true');
      sizes.push(await page.locator('#v7-log-text').evaluate(el => parseFloat(getComputedStyle(el).fontSize)));
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-reading', mode);
      await expect(page.locator(`[data-v10-reading="${mode}"] b`)).toHaveText(label);
      for (const route of ['settings', 'home', 'library', 'workout', 'program', 'nutrition', 'progress', 'tools', 'labs']) {
        await page.goto(`/index.html#${route}`);
        await expect(page.locator('html')).toHaveAttribute('data-route-ready', route);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        expect(overflow, `${route}/${mode}/${width}`).toBeLessThanOrEqual(1);
      }
      await openSettings(page);
    }
    expect(sizes[1]).toBeGreaterThan(sizes[0] * 1.1);
    expect(sizes[2]).toBeGreaterThan(sizes[1] * 1.2);
    await page.locator('#v7-language-actions [data-lang="en"]').click();
    await expect(page.locator('#v10-reading-title')).toHaveText('Text size');
    await expect(page.locator('#v10-reading-actions b')).toHaveText(['Small', 'Medium', 'Large']);
  });
}
