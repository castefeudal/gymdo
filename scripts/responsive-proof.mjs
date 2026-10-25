import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.MMG_PROOF_URL || 'http://127.0.0.1:4173/';
const directory = 'artifacts/responsive-proof';
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const theme of ['obsidian', 'soft', 'ivory']) {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    await context.addInitScript(theme => localStorage.setItem('mmg.theme.v2', theme), theme);
    const page = await context.newPage();
    await page.goto(base);
    await page.locator('html[data-app-ready=true]').waitFor();
    await page.locator('#mmg-boot').waitFor({ state: 'detached' });
    await page.evaluate(() => document.fonts.ready);
    for (const width of [320, 360, 375, 390, 430, 768, 1024, 1280, 1440, 1920, 2560]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      for (const route of ['home', 'library', 'workout', 'program', 'nutrition', 'progress', 'labs', 'tools', 'settings']) {
        await page.evaluate(route => { location.hash = route; }, route);
        await page.locator(`html[data-route-ready="${route}"]`).waitFor();
        if (route === 'nutrition') await page.locator('[data-food-add]').waitFor();
        if (route === 'labs') await page.locator('.lab-result-form').waitFor();
        if (route === 'library') await page.locator('#grid .card').first().waitFor();
        if (route === 'tools') await page.locator('[data-lab-form]').first().waitFor();
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        const name = `${theme}-${width}-${route}`;
        const screenshot = [320, 390, 1440, 2560].includes(width) ? `${directory}/${name}.png` : null;
        if (screenshot) await page.screenshot({ path: screenshot, animations: 'disabled' });
        results.push({ theme, width, route, overflow, screenshot });
        if (overflow > 1) console.log(`OVERFLOW ${name}: ${overflow}px`);
      }
    }
    await context.close();
    console.log(`Completed ${theme}`);
  }
} finally {
  await browser.close();
  await writeFile(`${directory}/results.json`, JSON.stringify({ base, results }, null, 2));
}
console.log(`${results.length} route/theme/viewport checks; ${results.filter(row => row.overflow > 1).length} overflows`);
if (results.some(row => row.overflow > 1)) process.exitCode = 1;
