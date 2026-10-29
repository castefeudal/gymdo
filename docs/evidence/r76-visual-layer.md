# r76 visual layer record

Adds an author-owned graphic and photographic layer on top of the existing token
system, without touching data, storage schemas or route behaviour. Release version
`2026.10-r76.0-visual-layer`; the Service Worker cache name changes with it, so a
returning visitor receives the new stylesheet and the new precached artwork instead
of the shell cached under r75.

Catalogued in [docs/visual-assets-inventory.md](../visual-assets-inventory.md) and
governed by [docs/design-system.md](../design-system.md).

## What shipped

* Five original photographs (`assets/visual/*.webp`, 207 KB for the whole layer) on
  the four screens where a physical setting carries meaning, plus a half-size
  same-frame variant for the TODAY hero below 761 px.
* Eleven single-tone line-art files used as CSS `mask-image`, so one artwork serves
  Obsidian, Soft and Ivory from one token. Route marks are selected by
  `body[data-v7-route]`; `state-empty.svg` marks an empty collection and
  `plate-mark.svg` sits inside the library media plate.
* `--media-plate` became a graded surface, so third-party 180×180 demonstrations
  read as a lit plate instead of a white rectangle pasted on the card. The Gym
  visual artwork itself is unmodified, and its licence is now stated in the modal
  media chrome and on the «Ещё» screen rather than only in `NOTICE.md`.
* 164 superseded CSS rule blocks removed with `scripts/find-shadowed-css.mjs`,
  against the 30 the new layer adds — 3,057 `@sequence` markers before, 2,923 now.
  That net is what pays for the layer inside the existing stylesheet budget.

## Findings from verification

Four defects were found by measuring the rendered result rather than the code, and
all four are fixed in this increment.

1. **The route marks were invisible to the audience that matters.** They were bound
   to `.section-head` / `.v7-page-head`, and `applyV7Route` hides both for a
   returning visitor. A computed-style probe over the live routes found zero
   rendered marks on `home`, `library`, `workout`, `progress`, `program`, `tools`,
   `settings` and `more`; only the `labs` and deep `nutrition` section heads painted
   one, and `.v7-page-head` painted none at all. The context
   bar is now a host (`.v8-context-inner::after`), which is the only head a
   returning user sees. Re-measured after the fix: all ten bound routes paint a
   160×64 mark at `.34`, and the eight that had nothing still have no painted head
   except `nutrition` and `labs`.
2. **Marks overflowed their host.** A 300×120 mark anchored at `bottom:-8px` inside
   a 47 px head hung into the next card, and the card painted over it. Marks are now
   sized from the host's height and stay inside the host box.
3. **The watermark strength was a single constant.** `opacity:.15` of `--text-muted`
   is invisible on the Obsidian canvas and merely faint on the light themes. One
   theme token, `--art-opacity`, now carries `.34` on Obsidian and `.2` elsewhere,
   measured against the rendered pixels rather than the source.
4. **`section-today.svg` had no host at all** and was still listed in the precache.
   It is now bound to the TODAY context bar, so every supported route carries a mark
   and no shipped file is dead weight.

Two capture-tool defects also surfaced. The mobile filter trigger does not exist on
a wide viewport, so the `filters` pass burned a 30-second timeout on every desktop
row; it now checks visibility first. And a `fullPage` screenshot resizes the
viewport, which re-applies the route and hides the onboarding hero again — the first
two `firstrun` captures showed the Today view while still fetching the hero
photograph. That pass now shoots at viewport height.

A further defect was in the working tree rather than the product. This repository stores
`app.js`, `scripts/build-index.mjs` and `src/app/service-worker.js` with CRLF and runs
`core.autocrlf=input`, so editing them as LF rewrites every line: `git diff` reported
13,318 changed lines in `app.js` for a one-line version bump. `git ls-files --eol`
exposed it (`i/crlf w/lf`), the three files were converted back, and the same diff is
now 1 + 1 + 18 lines. The increment totals 315 insertions against 770 deletions, which
is the shadowed-rule cleanup, not a reformat.

## Evidence

`scripts/visual-evidence.mjs` records the matrix; `before-*` is the pre-change tree
shot through the tool as it stood then, so those runs carry 55–56 rows rather than
the 62 of the after runs — the first-run and programme-summary passes did not exist
yet, which is exactly why those two screens needed adding. Each run also writes a
machine-readable `audit.json`. The 353 PNGs of the full matrix are about 117 MB, so
only the eleven screens linked at the end of this record are checked in; the rest are
excluded by `.gitignore` and regenerate with `node scripts/visual-evidence.mjs`.

| Run | Captures | Broken images | Rows overflowing | Capture failures |
| --- | --- | --- | --- | --- |
| `after-obsidian` | 62 | 0 | 0 | 0 |
| `after-soft` | 62 | 0 | 0 | 0 |
| `after-ivory` | 62 | 0 | 0 | 0 |

Per-screen image payload stays under one photograph plus the plate: TODAY 45 KB at
1440 and 23 KB at 360 (the 640 variant), nutrition 83 KB, programme summary 18 KB,
first-run hero 84 KB at 1440 and 62 KB at 390, every other route 5–6 KB of vector
marks. The `before-obsidian` run reported 52 unresolved image references on these
same pages; the after runs report none. Resource totals are timing-sensitive because
the optional catalog preload runs at idle, so they are recorded as an observation
about these captures, not as a measured regression fix.

Automated checks: 192 unit tests pass; the performance budget holds at
274,157/278,000 B raw and 48,736/50,000 B gzip for `app.css`, with the document at
9,189/10,000 B. The visual matrix is 218 cases in the Chromium desktop project; 35 of
them changed, all on the screens this layer touches — home, programme, nutrition,
library and the exercise modal — with no behavioural or Axe failure. Those 35 were
reviewed against their prior baseline before the Windows expectations were refreshed,
and the visual project now reports 218 passed; the whole desktop project —
functional, accessibility and visual together — reports 292 passed. The refresh run
itself lost one case to a
Windows socket flake (`net::ERR_NO_BUFFER_SPACE` while 218 contexts competed for
port 4173); re-run alone it passes against its untouched baseline, so `settings` has
no visual delta and only 35 baselines moved, not 36.

The Linux visual baselines are platform-specific and can only be regenerated by the
Quality workflow's `refresh_visual_baselines` input, so they were produced there and
reviewed from the artifact rather than on this machine. The regenerated set was 218
files: 26 differ beyond the comparison tolerance and are accepted — `home` in 17 of its
18 width/theme combinations (1920 Obsidian stayed inside tolerance) and `detail` in all
nine — while the other 111 differ only sub-threshold, which is
runner rasterization drift plus the small `--media-plate` change on `library`, and were
deliberately not accepted so this PR's visual delta stays attributable to the layer.
Ordinary Quality comparison against the accepted Linux baselines is green.

## Publication

PR #7 merged into `main` as `2222f8669b5d5d7b6eb3f7a9b3a7716c6d3d850a` at
2026-10-28T22:01:50Z. The push-triggered Quality run `40776738931` on that commit
finished with all six jobs `success`, `visual` included, which released Pages
deployment run `40777395281`. That deployment was proved from the published bytes
rather than from CI status: `release.json` returned commit `2222f866…` with
`publishedAt` 2026-10-28T22:06:56.497Z; the deployed `sw.js` carried
`const VERSION = '2026.10-r76.0-visual-layer'`; `assets/visual/today-hero-1280.webp`
answered 200 as `image/webp` in 31,988 bytes; and `node scripts/check-live.mjs` on the
full merge SHA passed — 37 published artifacts hash-matched their `git show HEAD:`
blobs, and all 480 route/theme/language/viewport combinations across chromium, mobile,
firefox, webkit and webkit-mobile walked with the backup round-trip, exercise
instructions, real OCR and an installed offline boot.

This record was then committed on top of the merge as
`dd71505747cd1a2122ed428ca5f91a1574acd5f5`. Quality run `40788773418` and Pages
deployment run `40789447673` were green for that commit, and `check-live.mjs` on it
reported the same 37 matched artifacts and the same 480 passing combinations, with
`release.json` at commit `dd71505…` and `publishedAt` 2026-10-28T23:44:59.616Z.

`docs/` is outside the Pages artifact set, so a documentation commit changes only
`release.json`; the shipped HTML, CSS, runtime, data and media stay byte-identical to
the merged release. The standing consequence is that the live `release.json` names the
newest successful `main` commit, which need not be the merge that introduced the release
under test. Both paragraphs above are anchored to their own runs. To establish what is
live at any later moment, read `release.json` and run `check-live.mjs` against that SHA.

## Not claimed

No independent design review, formal WCAG certification, or field INP/p75. The
photographs are generated for this project and are not documentary images of a real
session; they are used only where a setting carries meaning and never as a data
encoding. No AI-generated technique demonstrations were added: they cannot be
verified by a qualified reviewer, and the player would present unverified motion as
expert-checked.

Key reviewed screens: [Today](after-obsidian/1440-obsidian-home.png),
[first-run hero](after-obsidian/1440-obsidian-firstrun.png),
[programme summary](after-obsidian/1440-obsidian-plan.png),
[nutrition result](after-obsidian/1440-obsidian-nutrition.png),
[library plates](after-obsidian/1440-obsidian-library.png),
[exercise modal attribution](after-obsidian/1440-obsidian-detail.png),
[mobile Today](after-soft/390-soft-home.png),
[Ivory workout](after-ivory/768-ivory-workout.png).

The same three screens before the layer, for direct comparison:
[Today](before-obsidian/1440-obsidian-home.png),
[library](before-obsidian/1440-obsidian-library.png),
[nutrition](before-obsidian/1440-obsidian-nutrition.png).
