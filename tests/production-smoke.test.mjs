import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8');

test('canonical shell does not use payload bootstrap or document.write', async () => {
  const index = (await read('index.html')) + (await read('ui.html'));
  const bootstrap = await read('bootstrap.js');
  assert.doesNotMatch(index, /document\.write|r2\.payload\.b64/);
  assert.doesNotMatch(index, /<script[^>]+src=["']\.\/gym-tools\.js/);
  assert.match(index, /app\.css/);
  assert.match(index, /assets\/runtime\/application\.js/);
  assert.match(bootstrap, /import\('\.\/gym-tools\.js'\)/);
  assert.match(index, /src\/app\/entry\.mjs/);
});

test('bootstrap subscribes before the app can emit ready', async () => {
  const index = (await read('index.html')) + (await read('ui.html'));
  const app = index.search(/<script type=["']?module["']? src=["']?\.\/src\/app\/entry\.mjs/);
  const appSource = await read('app.js');
  assert.ok(app >= 0, 'entry must be loaded as a JavaScript module');
  const entry = await read('src/app/entry.mjs');
  assert.ok(entry.indexOf("import '../../bootstrap.js'") < entry.indexOf("await import('../../assets/runtime/application.js')"));
  assert.match(appSource, /^import '\.\/bootstrap\.js';/m);
  assert.match(appSource, /^import \{ createLocalFirstStore \} from '\.\/src\/persistence\/local-first-store\.mjs';/m);
  assert.match(appSource, /^import \{ createInitialState \} from '\.\/src\/app\/state\.mjs';/m);
  assert.match(appSource, /subscribeToHashChanges\(window, v7RouteFromHash/);
  assert.doesNotMatch(appSource, /addEventListener\(['"]hashchange/);
  const bootstrapSource = await read('bootstrap.js');
  const labSource = await read('gym-tools.js');
  for (const source of [bootstrapSource, labSource]) {
    assert.match(source, /subscribeToHashChanges\(window/);
    assert.doesNotMatch(source, /addEventListener\(['"]hashchange/);
  }
});

test('exercise GIF media uses a fresh revision and cache write failures stay non-fatal', async () => {
  const app = (await read('app.js')) + (await read('src/features/workout/run-view.mjs')) + (await read('src/features/exercise/card-view.mjs'));
  const sw = await read('sw.js');
  assert.match(app, /MEDIA_REVISION = '20260927-media4'/);
  assert.match(app, /\.gif\?v=' \+ MEDIA_REVISION/);
  assert.match(sw, /const VERSION = '2026\.\d{2}-r\d+(?:\.\d+)?-[a-z0-9-]+'/);
  assert.match(sw, /Cache Storage is an optimisation only/);
  assert.match(sw, /ignoreSearch: true/);
});

test('active exercise views always request GIF animation and service worker leaves videos alone', async () => {
  const app = (await read('app.js')) + (await read('src/features/workout/run-view.mjs')) + (await read('src/features/exercise/card-view.mjs'));
  const sw = await read('sw.js');
  assert.match(app, /img\.src = exMotion\(ex\);/);
  assert.doesNotMatch(app, /img\.src = REDUCED_MOTION\.matches \? exStill\(ex\) : exMotion\(ex\)/);
  assert.match(sw, /if \(\/\\\/videos\\\/\//);
  assert.match(sw, /Exercise GIFs are intentionally not intercepted/);
});

test('GIF previews autoplay whenever cards enter view without a manual playback control', async () => {
  const previews = await read('src/features/exercise/preview-motion.mjs');
  assert.match(previews, /IntersectionObserver/);
  assert.match(previews, /entry\.isIntersecting && entry\.intersectionRatio >= 0\.18/);
  assert.match(previews, /observer\.observe\(card\)/);
  assert.doesNotMatch(previews, /pointerover|pointerout|focusin|focusout|reducedMotion/);
  const shell = await read('src/views/shell.html');
  assert.doesNotMatch(shell, /id="modal-media-play"/);
});

test('PWA update lifecycle is controlled and shell assets are network-first', async () => {
  const index = (await read('index.html')) + (await read('ui.html'));
  const sw = await read('sw.js');
  const bootstrap = await read('bootstrap.js');
  assert.doesNotMatch(index, /_mmgsw|registration\.unregister\(\)/);
  assert.doesNotMatch(sw, /cache\.addAll\(PRECACHE\)\)\.then\(\(\) => self\.skipWaiting\(\)\)/);
  assert.match(sw, /SKIP_WAITING/);
  assert.match(bootstrap, /mmg-update/);
  assert.match(bootstrap, /controllerchange/);
  assert.match(sw, /fetch\(request, \{ cache: 'no-store' \}\)/);
});

test('exercise detail view keeps full-frame media and structured guidance', async () => {
  const index = (await read('index.html')) + (await read('ui.html'));
  const body = await read('app-body.html');
  const app = (await read('app.js')) + (await read('src/features/workout/run-view.mjs')) + (await read('src/features/exercise/card-view.mjs'));
  const css = (await read('styles/source/exercise.css')) + (await read('styles/source/workout.css')) + (await read('styles/source/library.css')) + (await read('styles/source/settings.css')) + (await read('styles/source/foundation.css'));
  for (const html of [index, body]) {
    assert.match(html, /id="modal-media-expand"/);
    assert.match(html, /id="modal-tabs"/);
    assert.match(html, /id="modal-cues"/);
    assert.match(html, /id="modal-errors"/);
    assert.match(html, /class="modal-visual"/);
  }
  assert.match(app, /function exerciseTechniqueModel\(ex\)/);
  assert.match(app, /C && C\.card && C\.card\.enhanced/);
  assert.match(app, /function defaultBreathingCue\(ex\)/);
  assert.match(app, /function toggleModalMedia\(\)/);
  assert.match(app, /class="run-tech-cues"/);
  assert.match(css, /object-fit:\s*contain/);
  assert.match(css, /#run \.run-media-frame \.run-media\s*\{[\s\S]*?object-fit:\s*contain/);
  assert.match(css, /\.card-media img\s*\{[\s\S]*?object-fit:\s*contain/);
});

test('detail assets use a cache-busting revision', async () => {
  const index = (await read('index.html')) + (await read('ui.html'));
  assert.match(index, /app\.css\?v=2026\.\d{2}-r\d+(?:\.\d+)?-[a-z0-9-]+/);
  assert.match(index, /entry\.mjs\?v=2026\.\d{2}-r\d+(?:\.\d+)?-[a-z0-9-]+/);
});

test('detail media box itself stays inside the visual frame and step counter increments once', async () => {
  const css = (await read('styles/source/exercise.css')) + (await read('styles/source/workout.css')) + (await read('styles/source/library.css')) + (await read('styles/source/settings.css')) + (await read('styles/source/foundation.css'));
  assert.match(css, /object-fit:\s*contain/);
  const pseudoRules = [...css.matchAll(/#modal \.modal-steps-detailed li::before\s*\{[^}]*\}/g)];
  assert.ok(pseudoRules.length, 'the actual step-number rules must be checked');
  for (const [rule] of pseudoRules) assert.doesNotMatch(rule, /counter-increment/);
});

test('one semantic palette owns the three themes', async () => {
  const tokens = await read('styles/source/tokens.css');
  for (const theme of ['obsidian', 'soft', 'ivory']) assert.ok(tokens.includes(`html[data-theme="${theme}"]`));
  for (const color of ['#bef47d', '#35700f', '#4c6a1e']) assert.ok(tokens.includes(color));
  for (const token of ['--bg-canvas:', '--bg-surface:', '--bg-elevated:', '--text-primary:', '--text-secondary:', '--text-muted:', '--border-subtle:', '--border-strong:', '--accent:', '--accent-hover:', '--accent-soft:', '--positive:', '--warning:', '--critical:']) assert.ok(tokens.includes(token));
});

test('saved theme is hydrated before stylesheet and runtime keeps theme metadata in sync', async () => {
  const index = (await read('index.html')) + (await read('ui.html'));
  const app = (await read('app.js')) + (await read('src/features/workout/run-view.mjs')) + (await read('src/features/exercise/card-view.mjs'));
  const hydrate = index.search(/localStorage\.getItem\(['"]mmg\.theme\.v2['"]\)/);
  const stylesheet = index.indexOf('app.css?v=');
  assert.ok(hydrate >= 0 && stylesheet > hydrate, 'saved theme must resolve before stylesheet paint');
  assert.match(app, /document\.documentElement\.style\.colorScheme = S\.theme === 'obsidian' \? 'dark' : 'light'/);
  assert.match(app, /obsidian: '#080C11', soft: '#EEF1F3', ivory: '#F4F2EC'/);
});

test('library cards expose useful type and level context plus live selection insights', async () => {
  const body = await read('app-body.html');
  const index = (await read('index.html')) + (await read('ui.html'));
  const app = (await read('app.js')) + (await read('src/features/workout/run-view.mjs')) + (await read('src/features/exercise/card-view.mjs'));
  for (const html of [body, index]) assert.match(html, /id="results-insights"/);
  assert.match(app, /class="card-specs"/);
  assert.match(app, /function renderResultsInsights\(items\)/);
  assert.match(app, /labels\.compound/);
  assert.match(app, /labels\.equipment/);
});

test('exercise dataset keeps all 1324 compact records', async () => {
  const dataset = JSON.parse(await read('data/exercises-compact.json'));
  assert.equal(dataset.x.length, 1324);
});

test('PWA manifest is relative-origin and points to a valid shell', async () => {
  const manifest = JSON.parse(await read('manifest.webmanifest'));
  assert.equal(manifest.id, './');
  assert.equal(manifest.start_url, './#home');
  assert.equal(manifest.scope, './');
  assert.ok(manifest.icons.length > 0);
});

test('service worker precaches the same shell resources as the index', async () => {
  const sw = await read('sw.js');
  const pages = await read('.github/workflows/pages.yml');
  const runtime = JSON.parse(await read('assets/runtime-manifest.json'));
  for (const resource of [...runtime, './index.html', './ui.html', './src/app/entry.mjs', './app.css', './bootstrap.js', './gym-tools.js', './src/app/router.mjs', './tools/gym-calculators.mjs', './tools/lab-calculators.mjs', './src/features/lab/evidence-registry.mjs', './src/features/nutrition/nutrition-analytics.mjs', './data/content.json', './data/exercise-catalog.json', './data/exercise-details.json', './data/exercise-media.json']) assert.ok(sw.includes("'" + resource + "'"), resource + ' must work offline');
  assert.ok(!sw.includes("'./app.js'"), 'authored app must not duplicate the compiled runtime in precache');
  assert.match(pages, /cp -R assets data images src styles tools videos site\//);
  assert.doesNotMatch(sw, /legacy-base\.html|r2\.payload/);
});

test('legacy production artifacts are classified and Pages ships only the active fallback', async () => {
  const pages = await read('.github/workflows/pages.yml');
  const inventory = await read('docs/legacy-inventory.md');
  assert.match(pages, /legacy-base\.html/);
  assert.doesNotMatch(pages, /setup\.html|r2\.payload\.b64/);
  assert.match(inventory, /Keep and retain the link/);
  assert.match(inventory, /Removed as an unconsumed and unreadable artifact/);
  assert.match(inventory, /mmg_current_workout_v1/);
});

test('generated shell uses a single compiled feature stylesheet and matching versions', async () => {
  const index = await read('index.html');
  const build = await read('scripts/build-index.mjs');
  assert.equal((index.match(/rel=["']?stylesheet["']?(?=[\s>])/g) || []).length, 1);
  assert.match(index, /app\.css/);
  assert.match(index, /ui\.html/);
  const version = build.match(/const BUILD_VERSION = '([^']+)'/)?.[1];
  assert.equal(index.match(/data-app-version=["']?([^\s"'>]+)/)?.[1],version);
  assert.ok((await read('app.js')).includes(`APP_VERSION = '${version}'`));
  assert.ok((await read('sw.js')).includes(`const VERSION = '${version}'`));
  assert.doesNotMatch(await read('ui.html'), /class="v8-rail"/);
});

test('daily nutrition records use a dedicated validated store and survive backup import/export flows', async () => {
  const app = (await read('app.js')) + (await read('src/features/workout/run-view.mjs')) + (await read('src/features/exercise/card-view.mjs'));
  const backupFields = await read('src/features/backup/backup-fields.mjs');
  const repository = await read('src/persistence/history-repository.mjs');
  assert.match(app, /K\.nutritionLog = 'mmg\.nutritionLog\.v1'/);
  assert.match(backupFields, /name === 'nutritionLog'[\s\S]*?cleanNutritionDays/);
  assert.match(app, /validateBackupField\(name, raw, \{/);
  assert.match(app, /historyRepository\.replaceNutritionDays\(importedNutritionDays\)/);
  assert.match(app, /nutritionLog'\?JSON\.stringify\(databaseNutritionDays\)/);
  assert.match(repository, /createObjectStore\(NUTRITION_DAY_STORE, \{ keyPath: 'date' \}\)/);
  assert.match(repository, /migrateLegacyNutritionDays/);
});

test('backward-compatible local storage keys remain in application code', async () => {
  const app = (await read('app.js')) + (await read('src/features/workout/run-view.mjs')) + (await read('src/features/exercise/card-view.mjs'));
  for (const key of ['mmg.favorites.v8', 'mmg.workout.v2', 'mmg.history.v1', 'mmg.lang.v2', 'mmg.theme.v2']) assert.match(app, new RegExp(key.replaceAll('.', '\\.')));
});


test('flagship 10 surface includes weekly pulse, contextual actions, workout balance and readability controls', async () => {
  const body = await read('app-body.html');
  const index = (await read('index.html')) + (await read('ui.html'));
  const app = (await read('app.js')) + (await read('src/features/workout/run-view.mjs')) + (await read('src/features/exercise/card-view.mjs'));
  const css = (await read('styles/source/exercise.css')) + (await read('styles/source/workout.css')) + (await read('styles/source/library.css')) + (await read('styles/source/settings.css')) + (await read('styles/source/foundation.css'));
  for (const html of [body, index]) {
    assert.match(html, /id="v10-home-pulse"/);
    assert.match(html, /id="v10-context-actions"/);
    assert.match(html, /id="v10-workout-balance"/);
    assert.match(html, /id="v10-reading-actions"/);
    assert.match(html, /id="v10-density-actions"/);
  }
  assert.match(app, /function renderV10HomePulse\(\)/);
  assert.match(app, /function renderV10ContextAction\(route\)/);
  assert.match(app, /function renderV10WorkoutBalance\(\)/);
  assert.match(app, /function dashNext\(\)\s*\{\s*var next=v7NextAction\(\)/);
  assert.match(app, /name === 'planDay'\) \{ startPlanDayV7\(Number\(act\.dataset\.cactDay\)\|\|0,false\)/);
  assert.match(app, /name === 'checkin'\) \{ scrollToId\('progress'\)[\s\S]*?\$\('g-weight'\)/);
  assert.match(await read('styles/source/today.css'), /v10-home-pulse/);
  assert.match(css, /html\[data-reading="comfortable"\]/);
  assert.match(css, /html\[data-reading="large"\]/);
  assert.match(css, /html\[data-density="compact"\]/);
});

test('programme survives reloads and edits are written back to saved state', async () => {
  const app = (await read('app.js')) + (await read('src/features/workout/run-view.mjs')) + (await read('src/features/exercise/card-view.mjs'));
  const expression=app.match(/var hasPersistedExerciseState = ([^;]+);/)[1];
  const needsCatalog=new Function('store','K','databaseExercisePreferences','databaseCustomExercises','return '+expression);
  const keys={fav:'fav',workout:'workout',plan:'plan'};
  const check=(value,prefs={},custom=[])=>needsCatalog({json:(key,fallback)=>value[key]??fallback},keys,prefs,custom);
  assert.equal(check({fav:[],workout:[],plan:null}),false);
  assert.equal(check({plan:{days:[{}]}}),true);
  assert.equal(check({workout:[{id:'0025'}]}),true);
  assert.equal(check({}, {'0025':'preferred'}),true);
  assert.equal(check({}, {}, [{id:'custom1'}]),true);
  assert.match(app, /function renderStoredPlanV10\(\)/);
  assert.match(app, /item\.ex=alt;\s*savePlanV7\(\);\s*renderStoredPlanV10\(\)/);
  assert.match(app, /day\.items\.splice\(itemIndex,1\);\s*savePlanV7\(\);/);
  const backupKeys = app.match(/DATA_KEYS=\[([^\]]+)\]/)[1];
  for (const key of ['plan', 'settings', 'recentSearch', 'recentExercises', 'labResults']) {
    assert.ok(backupKeys.includes(`'${key}'`), `${key} must be included in the production backup`);
  }
});

test('progress view can switch between weight waist and sleep', async () => {
  const app = (await read('app.js')) + (await read('src/features/workout/run-view.mjs')) + (await read('src/features/exercise/card-view.mjs'));
  assert.match(app, /var progressMetric = 'weight'/);
  assert.match(app, /function progressChartTabsV10\(\)/);
  assert.match(app, /\['weight', S\.lang/);
  assert.match(app, /\['waist', S\.lang/);
  assert.match(app, /\['sleep', S\.lang/);
  assert.match(app, /progressMetric = metric\.dataset\.progressMetric/);
});

test('first paint restores readability and density preferences before flagship stylesheet', async () => {
  const index = (await read('index.html')) + (await read('ui.html'));
  const hydration = index.search(/localStorage\.getItem\(['"]mmg\.settings\.v1['"]\)/);
  const stylesheet = index.indexOf('app.css?v=');
  assert.ok(hydration >= 0 && stylesheet > hydration, 'reading preference must hydrate before stylesheet paint');
  const density = index.indexOf('data-density', hydration);
  assert.ok(density > hydration && stylesheet > density, 'density preference must hydrate before stylesheet paint');
  assert.match(index, /data-app-version=["']?2026\.\d{2}-r\d+(?:\.\d+)?-[a-z0-9-]+/);
});


test('in-library quick scenarios reuse preset state and session balance flags duplication', async () => {
  const body = await read('app-body.html');
  const index = (await read('index.html')) + (await read('ui.html'));
  const app = (await read('app.js')) + (await read('src/features/workout/run-view.mjs')) + (await read('src/features/exercise/card-view.mjs'));
  const css = (await read('styles/source/exercise.css')) + (await read('styles/source/workout.css')) + (await read('styles/source/library.css')) + (await read('styles/source/settings.css')) + (await read('styles/source/foundation.css'));

  for (const html of [body, index]) {
    assert.match(html, /id="v10-library-quick-presets"/);
    assert.match(html, /id="v10-library-quick-label"/);
  }

  assert.match(app, /function renderV10LibraryQuick\(\)/);
  assert.match(app, /sameStringSetV10/);
  assert.match(app, /duplicated=maxSame>=3/);
  assert.match(app, /noCompound=compound===0&&rows.length>=4/);

  const block = await read('styles/source/library.css');
  assert.match(block, /\.v10-library-quick\s*\{/);
  assert.match(block, /\.v10-library-quick-btn\[aria-pressed="true"\]/);
  assert.match(index, /app\.css\?v=2026\.\d{2}-r\d+(?:\.\d+)?-[a-z0-9-]+/);
  assert.match(index, /entry\.mjs\?v=2026\.\d{2}-r\d+(?:\.\d+)?-[a-z0-9-]+/);
});
