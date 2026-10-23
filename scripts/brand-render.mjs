import { chromium } from '@playwright/test';

const shots = [
  ['tools/brand/_raster-512.html', 'assets/brand/icon-512.png', 512, 512],
  ['tools/brand/_raster-192.html', 'assets/brand/icon-192.png', 192, 192],
  ['tools/brand/_raster-maskable.html', 'assets/brand/icon-maskable-512.png', 512, 512],
  ['tools/brand/_raster-180.html', 'assets/brand/apple-touch-icon-180.png', 180, 180],
  ['tools/brand/_raster-og.html', 'assets/brand/og-image.png', 1200, 630],
];

const browser = await chromium.launch();
for (const [source, out, w, h] of shots) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto(`file://${process.cwd()}/${source}`);
  await page.waitForTimeout(150);
  await page.screenshot({ path: out });
  await page.close();
  console.log(`${out} ${w}x${h}`);
}
await browser.close();