import { chromium } from '@playwright/test';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.addInitScript(() => localStorage.setItem('mmg.theme.v2','soft'));
await page.goto('http://127.0.0.1:4173/index.html#library', { waitUntil:'load' });
await page.waitForSelector('#grid .card');
await page.waitForTimeout(500);
console.log(await page.evaluate(() => {
  const lib = document.getElementById('library-title');
  const lh = lib ? lib.closest('.section-head') : null;
  return JSON.stringify({ exists: !!lib, vis: lib ? !!lib.offsetParent : null, headDisplay: lh ? getComputedStyle(lh).display : null, sectionHidden: document.getElementById('library')?.hidden });
}));
await page.click('#grid .card [data-open]');
await page.waitForTimeout(800);
console.log(await page.evaluate(() => {
  const card = document.querySelector('.card-title');
  return JSON.stringify({ cardVis: !!card.offsetParent, order: [...document.querySelectorAll('h1,h2,h3')].filter(h=>h.offsetParent).slice(0,6).map(h=>h.tagName+':'+h.textContent.trim().slice(0,18)) });
}));
await browser.close();
