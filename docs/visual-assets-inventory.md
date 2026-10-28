# Visual asset inventory

Every graphic the interface actually loads, with its provenance and licence.
Regenerate the build with `npm run build:index`; the Service Worker precache
list in `src/app/service-worker.js` is the authority on which of these files
ship offline.

## Photographic layer — `assets/visual/*.webp`

Original author photography for MARKOV MADE GYM, produced for this project
(text-to-image generation with the Qoder image tool, then graded and encoded
locally). No third-party stock, no external CDN. Encoded with
`ffmpeg -c:v libwebp -preset photo`; the source PNGs are not kept in the
repository because they are 8–20× the shipped weight and are never referenced.

| File | Size | Purpose / host | Adaptive | Licence |
| --- | --- | --- | --- | --- |
| `today-hero-1280.webp` | 1280×732, 32 KB | TODAY — photographic plate above the session roster (`.next-roster::before`) | ≥761 px viewports | Proprietary, © 2026 Pavel Markov |
| `today-hero-640.webp` | 640×366, 10 KB | Same frame, halved — served to ≤760 px viewports by `@media (max-width:760px)` | ≤760 px viewports | Proprietary, © 2026 Pavel Markov |
| `onboarding-grip-960.webp` | 960×768, 53 KB | First-run hero (`.hero-main::after`) | Masked to a bottom band under 900 px | Proprietary, © 2026 Pavel Markov |
| `program-hypertrophy-720.webp` | 720×480, 12 KB | Programme summary plate (`.v10-plan-hero::after`) | Right-edge plate, `cover` | Proprietary, © 2026 Pavel Markov |
| `nutrition-plate-1120.webp` | 1120×640, 79 KB | Nutrition result plate (`#nutrition .tool-out::after`) | Right-edge plate, `cover` | Proprietary, © 2026 Pavel Markov |

Photographs are always painted behind interface content: each host element
declares `isolation: isolate` and the image sits at `z-index: -1` under a
gradient mask, so no text, control or real data ever composites over a
photograph. Food photography is used only as an editorial band and is never
attached to a specific product, portion or logged entry.

## Graphic system — `assets/visual/*.svg`

Hand-authored vector line art. Each file is single-tone and paints with
`stroke="currentColor"`, which makes it usable as a CSS `mask-image`: one file
serves Obsidian, Soft and Ivory from a single token, with no per-theme variant
and no duplicated artwork. Declared once in `styles/source/tokens.css`.

| File | Token | Purpose |
| --- | --- | --- |
| `section-today.svg` | `--art-today` | TODAY composition: tick horizon, clock dial, schedule block |
| `section-workout.svg` | `--art-workout` | Barbell over a load ruler |
| `section-library.svg` | `--art-library` | Filter rule, card grid, index column |
| `section-program.svg` | `--art-program` | Mesocycle blocks with a hatched deload week |
| `section-nutrition.svg` | `--art-nutrition` | Segmented macro ring and data rules |
| `section-progress.svg` | `--art-progress` | Axes, trend, moving average, PR flag |
| `section-labs.svg` | `--art-labs` | Assay reticle, droplet, calibrated card |
| `section-tools.svg` | `--art-tools` | Gauge, needle and measurement scale |
| `section-settings.svg` | `--art-settings` | Contrast dial and display sliders |
| `plate-mark.svg` | `--art-plate` | Geometric M watermark inside the library media plate (`.card-media::before`) |
| `state-empty.svg` | `--art-empty` | Unloaded barbell — empty state (`.empty::before`) |

The route marks are applied by `.section-head::after`, `.v7-page-head::after` and
`.v8-context-inner::after`, and selected by `body[data-v7-route="…"]`, so the
identity travels with the route rather than with a hand-placed element. The
context bar matters most: a returning user never sees the large page head, so
without that host eight of ten routes would carry no mark at all. There the
watermark sits in the empty middle of the bar and is dropped below 901 px,
where no gap is left and the photographic layer already carries the identity.
Each mark is sized from its host's height and never overflows the host box — a
mark that hangs below a head is painted over by the next card. Strength comes
from one theme token, `--art-opacity`: `.2` on the light canvases, `.34` on
Obsidian, where `--text-muted` is a mid grey that disappears at `.15`.

## Third-party exercise media

The 1,324 demonstration images and GIFs remain **© Gym visual**
(<https://gymvisual.com/>) and are redistributed unmodified at the licensed
180×180. See `NOTICE.md` and `docs/exercise-media.md`.

* No Gym visual frame is upscaled, regenerated or re-licensed. The plate they
  sit on was redesigned (`--media-plate` is now a graded surface with the
  geometric M watermark); the artwork itself is untouched.
* Attribution is now surfaced in the interface, not only in `NOTICE.md`:
  a `.media-credit` line under the exercise demonstration in `src/views/shell.html`
  and a rights statement on the «Ещё» screen in `src/views/more.html`.
* `data/exercise-media.json` still contains no records, so no new demonstration
  media was added. AI-generated technique demonstrations were deliberately
  **not** introduced: they cannot be verified by a qualified reviewer, and the
  player would have to present unverified motion as expert-checked.

## Offline and performance

All 16 files are listed in the Service Worker `PRECACHE` array, so the visual
layer survives an offline boot. Total shipped weight of the layer is 207 KB, of
which 42 KB is the two TODAY variants (only one is ever fetched). The layer
adds no render-blocking request beyond `app.css` itself: every photograph is a
CSS background, so it is discovered after the stylesheet and never competes
with the hero text for LCP.
