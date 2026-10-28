// Local visual-evidence capture. Not part of the shipped page weight; run with
// `node scripts/visual-evidence.mjs <label> [filter]` and read docs/evidence/<label>/.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { chromium } from 'playwright';

for (const key of ['NO_PROXY', 'no_proxy']) {
  process.env[key] = [...(process.env[key] || '').split(','), '127.0.0.1', 'localhost'].filter(Boolean).join(',');
}

const root = resolve(import.meta.dirname, '..');
const label = process.argv[2] || 'evidence';
const filter = process.argv[3] || '';
const port = Number(process.env.MMG_EVIDENCE_PORT || 4199);
const base = `http://127.0.0.1:${port}`;
const outDir = resolve(root, 'docs/evidence', label);
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const sizes = [['360', 360, 800], ['390', 390, 844], ['768', 768, 1024], ['1440', 1440, 900]];
const themes = ['obsidian', 'soft', 'ivory'];
const routes = ['home', 'library', 'workout', 'progress', 'program', 'nutrition', 'labs', 'tools', 'settings', 'more'];

const server = spawn(process.execPath, [resolve(root, 'scripts/serve.mjs')], {
  env: { ...process.env, PORT: String(port) }, stdio: 'ignore',
});
const wait = ms => new Promise(r => setTimeout(r, ms));

async function seed(page, theme, firstRun) {
  const key = `${theme}${firstRun ? '-new' : ''}`;
  if (page.__seeded === key) return;
  page.__seeded = key;
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(({ theme, firstRun }) => {
    localStorage.setItem('mmg.theme.v2', theme);
    // The first-run pass leaves every record empty on purpose: the onboarding
    // hero only exists for a visitor who has never answered the intake, and a
    // shared context would carry the programme built by the plan pass.
    if (firstRun) return;
    localStorage.setItem('mmg.profile.v1', JSON.stringify({ goal: 'muscle', level: 'middle', place: 'gym', days: 3, done: true }));
    localStorage.setItem('mmg.workout.v2', JSON.stringify([{ id: '0025', sets: 3, reps: '8–12', weight: '60', done: false }]));
    localStorage.setItem('mmg.settings.v1', JSON.stringify({ rir: true, rpe: true, reading: 'balanced' }));
    localStorage.setItem('mmg.diary.v1', JSON.stringify([
      { date: '2026-10-04', weight: 80.4, waist: 84, sleep: 7.5, fatigue: 2 },
      { date: '2026-09-28', weight: 80.8, waist: 84.5, sleep: 7, fatigue: 2 },
      { date: '2026-09-21', weight: 81.1, waist: 85, sleep: 7.5, fatigue: 2 },
    ]));
  }, { theme, firstRun });
}

const rows = [];
let brokenTotal = 0;
const failures = new Set();

async function capture(context, theme, route, name, action, firstRun) {
  const page = await context.newPage();
  page.on('response', r => { if (r.status() >= 400 && !r.url().includes('favicon')) failures.add(`${r.status()} ${r.url().replace(base, '')}`); });
  page.on('pageerror', e => failures.add(`PAGEERROR ${String(e).slice(0, 120)}`));
  try {
    await seed(page, theme, firstRun);
    await page.goto(`${base}/index.html#${route}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(r => document.documentElement.getAttribute('data-route-ready') === r, route, { timeout: 45_000 });
    await page.evaluate(() => document.fonts.ready);
    await wait(400);
    if (action) await action(page).catch(e => failures.add(`ACTION ${name}: ${String(e).slice(0, 120)}`));
    if (action) await wait(500);
    const audit = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')].filter(i => i.checkVisibility());
      const broken = imgs.filter(i => i.getAttribute('src') && i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src'));
      const overflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      let bytes = 0;
      for (const e of performance.getEntriesByType('resource')) if (/\.(?:jpe?g|png|webp|avif|gif|svg)$/i.test(e.name)) bytes += e.encodedBodySize || 0;
      return { broken, overflow, visible: imgs.length, bytes: Math.round(bytes / 1024) };
    });
    brokenTotal += audit.broken.length;
    // A full-page shot resizes the viewport, which re-applies the route and
    // hides the onboarding hero again, so that pass stays at viewport height.
    await page.screenshot({ path: resolve(outDir, `${name}.png`), fullPage: !firstRun });
    rows.push({ name, ...audit });
    process.stdout.write(`${name} img=${audit.visible} broken=${audit.broken.length} overflow=${audit.overflow} media=${audit.bytes}KB\n`);
    if (audit.broken.length) process.stdout.write(`  BROKEN ${audit.broken.join(' ')}\n`);
  } catch (e) {
    failures.add(`CAPTURE ${name}: ${String(e.message).split('\n')[0]}`);
    process.stdout.write(`${name} FAILED ${String(e.message).split('\n')[0]}\n`);
  } finally {
    await page.close();
  }
}

const overlays = [
  ['detail', 'library', async p => { await p.locator('#grid [data-open]').first().click(); await p.waitForSelector('#modal[data-open="true"]'); }],
  ['run', 'workout', async p => { await p.locator('[data-v8-start-run]:visible, #w-run:visible').first().click(); await p.waitForSelector('#run[data-open="true"]'); }],
  ['filters', 'library', async p => {
    // Wide viewports keep the filter sidebar open, so only the mobile bar has a trigger.
    const trigger = p.locator('#mfb-open:visible');
    if (await trigger.count()) { await trigger.click(); await p.waitForSelector('#filters[data-open="true"]'); }
  }],
  ['command', 'home', async p => { await p.locator('#cmdk-open').click(); await p.locator('#cmdk-input').fill('прогресс'); }],
  ['plan', 'program', async p => {
    // The programme summary only exists after the intake wizard is completed.
    for (let step = 0; step < 5; step += 1) await p.locator('#wizard-next').click();
    await p.locator('#plan-build').click();
    await p.waitForSelector('.v10-plan-hero');
  }],
];

try {
  await wait(1200);
  const browser = await chromium.launch({ args: ['--no-proxy-server'] });
  for (const [size, width, height] of sizes) {
    for (const theme of themes) {
      if (filter && !theme.includes(filter) && !size.includes(filter)) continue;
      const context = await browser.newContext({ viewport: { width, height }, isMobile: width < 768, hasTouch: width < 768 });
      for (const route of routes) {
        if (filter && !route.includes(filter) && !theme.includes(filter) && !size.includes(filter)) continue;
        await capture(context, theme, route, `${size}-${theme}-${route}`);
      }
      for (const [state, route, action] of overlays) {
        if (filter && !route.includes(filter) && !theme.includes(filter) && !size.includes(filter)) continue;
        await capture(context, theme, route, `${size}-${theme}-${state}`, action);
      }
      // The onboarding hero is only reachable from the unfinished-profile CTA,
      // and it needs a context no other pass has written to.
      if (size === '1440' || size === '390') {
        const fresh = await browser.newContext({ viewport: { width, height }, isMobile: width < 768, hasTouch: width < 768 });
        await capture(fresh, theme, 'home', `${size}-${theme}-firstrun`, async p => {
          await p.locator('[data-v7-action="profile"]:visible').first().click();
          await p.waitForSelector('.hero:not([hidden])');
        }, true);
        await fresh.close();
      }
      await context.close();
    }
  }
  await browser.close();
} finally {
  server.kill();
}
writeFileSync(resolve(outDir, 'audit.json'), JSON.stringify({ label, brokenTotal, failures: [...failures], rows }, null, 2));
process.stdout.write(`\nDONE label=${label} brokenImages=${brokenTotal} failures=${failures.size} dir=docs/evidence/${label}\n`);
for (const f of failures) process.stdout.write(`  ${f}\n`);
