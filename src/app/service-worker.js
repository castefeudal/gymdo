const VERSION = '2026.10-r76.0-visual-layer';
const PREFIX = 'mmg-gym-';
const SHELL = `${PREFIX}shell-${VERSION}`;
const MEDIA = `${PREFIX}media-${VERSION}`;
// Bundle outputs include their own lazy modules. Do not also cache authored copies.
const PRECACHE = [
// GENERATED_RUNTIME_ASSETS
  './',
  './index.html',
  './app.css',
  './assets/fonts/inter-latin.woff2',
  './assets/fonts/inter-cyrillic.woff2',
  './assets/fonts/inter-latin-ext.woff2',
  './ui.html',
  './src/app/entry.mjs',
  './src/app/router.mjs',
  './bootstrap.js',
  './gym-tools.js',
  './tools/gym-calculators.mjs',
  './tools/lab-calculators.mjs',
  './src/features/lab/evidence-registry.mjs',
  './src/features/nutrition/nutrition-analytics.mjs',
  './data/content.json',
  './data/exercise-catalog.json',
  './data/exercise-details.json',
  './data/exercise-media.json',
  './manifest.webmanifest',
  './images/gym-mark.svg',
  './images/exercise-placeholder.svg',
  './assets/visual/nutrition-plate-1120.webp',
  './assets/visual/onboarding-grip-960.webp',
  './assets/visual/plate-mark.svg',
  './assets/visual/program-hypertrophy-720.webp',
  './assets/visual/section-labs.svg',
  './assets/visual/section-library.svg',
  './assets/visual/section-nutrition.svg',
  './assets/visual/section-program.svg',
  './assets/visual/section-progress.svg',
  './assets/visual/section-settings.svg',
  './assets/visual/section-today.svg',
  './assets/visual/section-tools.svg',
  './assets/visual/section-workout.svg',
  './assets/visual/state-empty.svg',
  './assets/visual/today-hero-1280.webp',
  './assets/visual/today-hero-640.webp',
];
const MEDIA_LIMIT = 180;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(PREFIX) && key !== SHELL && key !== MEDIA).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function trimMedia(cache) {
  const keys = await cache.keys();
  while (keys.length > MEDIA_LIMIT) await cache.delete(keys.shift());
}

let shellRetryAt = 0;
async function shellResponse(request, key = request) {
  let cached;
  try { cached = await caches.match(key, { ignoreSearch: true }); } catch {}
  if (cached && (self.navigator.onLine === false || Date.now() < shellRetryAt)) return { response: cached, fromCache: true };
  let timer;
  try {
    const network = fetch(request, { cache: 'no-store' });
    // An unreachable origin may leave fetch pending rather than rejecting.
    // A previously installed shell must remain usable in that condition.
    const response = cached ? await Promise.race([
      network,
      new Promise(resolve => { timer = setTimeout(() => { shellRetryAt = Date.now() + 15000; resolve(cached); }, 3000); }),
    ]) : await network;
    return { response, fromCache: response === cached };
  } catch {
    shellRetryAt = Date.now() + 15000;
    return { response: cached || Response.error(), fromCache: true };
  } finally {
    clearTimeout(timer);
  }
}

async function networkFirstNavigation(request) {
  const { response, fromCache } = await shellResponse(request, './index.html');
  if (!fromCache && response.ok) {
    try { const cache = await caches.open(SHELL); await cache.put('./index.html', response.clone()); } catch {}
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }
  // Optional local OCR/PDF engines are cached only when used, never during install.
  if (/\/assets\/vendor\//.test(url.pathname)) {
    event.respondWith((async()=>{const cache=await caches.open(SHELL);const hit=await cache.match(request);if(hit)return hit;const response=await fetch(request);if(response.ok){try{await cache.put(request,response.clone());}catch{}}return response;})());
    return;
  }

  if (/\/videos\//.test(url.pathname)) {
    // Exercise GIFs are intentionally not intercepted. Let the browser fetch
    // them directly so animation/range responses cannot be altered by Cache API.
    return;
  }

  if (/\/images\//.test(url.pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(MEDIA);
      const hit = await cache.match(request);
      if (hit) return hit;
      if (self.navigator.onLine === false || Date.now() < shellRetryAt) return caches.match('./images/exercise-placeholder.svg');
      try {
        const response = await fetch(request);
        if (response.ok) {
          try {
            await cache.put(request, response.clone());
            await trimMedia(cache);
          } catch {
            // Cache Storage is an optimisation only. Never replace a valid
            // media response just because quota/private-mode cache writes fail.
          }
        }
        return response;
      } catch {
        return caches.match('./images/exercise-placeholder.svg');
      }
    })());
    return;
  }

  if (PRECACHE.some((path) => url.pathname.endsWith(path.replace('./', '/')))) {
    event.respondWith(shellResponse(request).then(result => result.response));
  }
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'GET_VERSION') event.source?.postMessage({ type: 'VERSION', version: VERSION });
});
