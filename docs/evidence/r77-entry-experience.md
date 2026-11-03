# r77 — Precision in motion entry

Date: 2026-11-03 (Europe/Minsk). Based on origin/main `50cd1f70a240f114c18bc4229f9a5e69b3146b50`.

## Delivered experience

A separate full-screen language entrance: graphite stage, monumental Inter typography, lime #BEF47D, and an original metallic M sculpture authored as inline SVG. No stock photography, generated portraits, video, animation libraries, or additional dependencies.

The mobile composition places the sculpture between the introduction and language choices. Short portrait screens omit the decorative sculpture so both choices and attribution remain visible. Short landscape screens put the choices beside the title. The component uses minimum 100svh, supports vertical scrolling when needed, and respects mobile safe areas.

The header opens the personal Telegram conversation with @markovmade and an encodeURIComponent-encoded localized draft. The footer provides the ordinary profile link. No message is sent automatically.

## Integration

Only clean addresses enter the new screen. An initial hash bypasses it. Language selection calls the existing state setter/applyLang, retaining query parameters, mmg.lang.v2, and in-app switching. The app initializes behind the existing boot cover, then reveals the entrance without showing an intermediate home screen. Selecting a language immediately opens #home. Existing boot errors and retry remain accessible.

The component makes background siblings inert while visible and restores their previous inert values on exit. Keyboard focus starts at the entrance, traverses the contact link and choices, then returns to application content. Reduced motion removes entrance and interaction animations. Color changes are immediate to preserve contrast throughout keyboard focus; transform provides the interaction motion.

CSS is isolated under .entry and the entry lifecycle body classes. Source rules preserve @sequence. The shared application adapter only imports/mounts the component and updates the release version; internal feature architecture and persistence schemas are unchanged.

## Verification

- npm run quality: PASS, including syntax, complete rebuild, resource budgets, and 193/193 unit/source tests.
- Entry plus installed offline-shell tests: 21/21 PASS in desktop Chromium, mobile Chromium emulation, and Firefox.
- Final responsive/reduced-motion matrix after the compact landscape refinement: 3/3 PASS across those projects. Widths: 320, 360, 375, 390, 430, 768, 1024, 1440, 1920, plus 844×390 landscape. Checks cover horizontal overflow, actual rectangle intersection, control size, text fit, and short-screen action visibility.
- Existing production/session/offline and visual regression selection: 42/42 PASS. It includes IndexedDB, backups, custom exercises, equipment profiles, saved language, update controls, home/workout screenshots, and offline states. Existing screenshot baselines were not changed.
- Installed offline entrance additionally verified: the clean address loads from the service worker, language selection works, and application routes remain accessible without an origin connection.
- Entry accessibility: no serious/critical axe violations in the passing browser projects, including focused language selection. Keyboard operation and reduced motion are covered.
- WebKit: 6/6 entry checks PASS in the final isolated run. The size matrix compensates for Windows WebKit mapping requested pixels through 125% OS scaling, so it exercises the requested CSS viewport sizes.

Screenshots were inspected at desktop, tablet, mobile and short landscape sizes. Evidence images are in entry-r77/. All ten size captures remain reproducible under artifacts/entry/ through the entry test.

## Resource cost and limits

Final compiled CSS: 287287 B raw / 51630 B gzip. Markup: 125868 B / 28864 B gzip. Total runtime: 530444 B / 177175 B gzip. Initial static JS: 453486 B; complete boot graph: 484828 B. Explicit budgets were adjusted for the added isolated component; no dependency or video payload was added.

These are local automated browser/emulation results and screenshot review, not physical-device, manual screen-reader, field-performance, or Telegram-client draft-rendering verification. The Telegram URL and decoded draft were checked in the browser DOM. Artistic quality remains a design judgment, supported here by the actual captures rather than a numeric quality score.

## Five review criteria

- Visual direction: one light direction, authored silver/lime sculpture, restrained surface treatment, and a consistent type scale.
- Composition: distinct desktop, mobile, short portrait and landscape arrangements; language actions keep priority.
- Interaction: one-click entry, visible keyboard focus, no artificial waiting step, and a short app reveal.
- Engineering: existing language/persistence/boot systems, no new dependency, scoped styles and regression checks.
- Brand identity: the M geometry, lime accent and recognizable MARKOVMADE attribution tie the entrance to the existing application.

## Changed files

The source changes are app.js, src/app/entry.mjs, src/features/entry/entry-screen.mjs, src/views/entry.html, src/views/shell.html, styles/source/entry.css, scripts/build-index.mjs, scripts/performance-budget.mjs, src/app/service-worker.js, tests/e2e/entry-screen.spec.mjs and tests/e2e/offline-shell.spec.mjs.

Rebuilt outputs are app-body.html, ui.html, app.css, index.html, sw.js, assets/runtime/application.js and assets/runtime-metrics.json. This report and selected screenshots complete the review evidence.

## Publication follow-up

The first publish attempt was correctly blocked by the Linux generated-file check: the new LF view and historical CRLF views produced a mixed artifact. The view builder now normalizes to the historical CRLF output on both platforms, with a dedicated LF/CRLF/mixed-fixture regression test. The entry tests are included in the four-browser behavior CI job. The existing skip link remains before the entry component so it retains its keyboard and landmark semantics on internal routes. Live verification derives its expected version from the current build source.
