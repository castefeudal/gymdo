/* Atmospheric visual generator for MARKOV MADE GYM.
   Authors abstract light-field compositions as standalone HTML, rasterises them
   with Playwright chromium and encodes WebP with ffmpeg into assets/visual/.
   Run: node scripts/visual-assets.mjs                                   */
import { writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';

const outDir = 'assets/visual';
const workDir = 'tools/visual';
await mkdir(outDir, { recursive: true });
await mkdir(workDir, { recursive: true });

const LIME = '190,244,125';
const STEEL = '139,191,209';
const PAPER = '244,247,245';

// Deterministic bokeh field: [x%, y%, radius px, rgb, opacity, blur px]
const BOKEH = [
  [12, 18, 90, LIME, .17, 26], [26, 62, 46, STEEL, .20, 18], [38, 30, 120, LIME, .10, 34],
  [55, 74, 60, PAPER, .12, 22], [66, 22, 96, STEEL, .15, 28], [78, 58, 40, LIME, .22, 16],
  [88, 30, 130, LIME, .12, 36], [8, 78, 70, STEEL, .14, 24], [46, 12, 52, PAPER, .10, 20],
  [70, 84, 84, STEEL, .12, 26], [30, 86, 38, LIME, .17, 15], [92, 76, 56, PAPER, .09, 20],
  [18, 44, 30, PAPER, .14, 12], [60, 46, 26, LIME, .20, 11], [82, 12, 34, STEEL, .17, 13],
  [40, 58, 74, LIME, .09, 24],
];

const atmos = (w, h) => `<!doctype html><html><head><meta charset="utf-8"><style>
  html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden;background:#0a0d0d}
  .f{position:absolute;inset:0}
  .glow-a{background:radial-gradient(46% 42% at 82% 16%, rgba(${LIME},.22), transparent 66%)}
  .glow-b{background:radial-gradient(42% 40% at 10% 84%, rgba(${STEEL},.18), transparent 68%)}
  .glow-c{background:radial-gradient(60% 50% at 50% 118%, rgba(${LIME},.11), transparent 70%)}
  .bokeh i{position:absolute;border-radius:50%;transform:translate(-50%,-50%)}
  .streak{background:
     linear-gradient(112deg, transparent 40%, rgba(${PAPER},.09) 50%, transparent 60%),
     linear-gradient(74deg, transparent 60%, rgba(${LIME},.08) 70%, transparent 80%)}
  .haze{opacity:.05;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='240' height='240' filter='url(%23n)'/%3E%3C/svg%3E")}
  .vig{background:radial-gradient(120% 96% at 50% 42%, transparent 46%, rgba(0,0,0,.55) 100%)}
  .floor{background:linear-gradient(180deg, transparent 62%, rgba(${STEEL},.05) 84%, rgba(0,0,0,.4) 100%)}
</style></head><body>
  <div class="f glow-a"></div><div class="f glow-b"></div><div class="f glow-c"></div>
  <div class="f streak"></div>
  <div class="f bokeh">${BOKEH.map(([x, y, r, c, o, b]) => `<i style="left:${x}%;top:${y}%;width:${r}px;height:${r}px;background:rgba(${c},${o});filter:blur(${b}px)"></i>`).join('')}</div>
  <div class="f haze"></div><div class="f floor"></div><div class="f vig"></div>
</body></html>`;

const jobs = [
  { name: 'entry-atmos-1600', w: 1600, h: 1000 },
  { name: 'entry-atmos-800', w: 800, h: 500 },
];

for (const job of jobs) {
  const htmlPath = `${workDir}/_${job.name}.html`;
  await writeFile(htmlPath, atmos(job.w, job.h));
}

const browser = await chromium.launch();
for (const job of jobs) {
  const page = await browser.newPage({ viewport: { width: job.w, height: job.h }, deviceScaleFactor: 1 });
  await page.goto(`file://${process.cwd()}/${workDir}/_${job.name}.html`);
  await page.waitForTimeout(120);
  const png = `${workDir}/_${job.name}.png`;
  await page.screenshot({ path: png });
  await page.close();
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-c:v', 'libwebp', '-preset', 'photo', '-quality', '72', `${outDir}/${job.name}.webp`]);
  console.log(`assets/visual/${job.name}.webp ${job.w}x${job.h}`);
}
await browser.close();
console.log('visual assets written');
