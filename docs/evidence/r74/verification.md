# r74 verification record — 2026-10-25

This is an incomplete implementation increment, not completion of the Premium
Fitness OS brief. The work remains in draft PR #1. No r74 production deployment
is claimed.

## Implemented

- Local laboratory journal with original values/units, report intervals, date/time,
  laboratory, method/context, edit/delete, comparison and same-day diary coverage.
- Verified schema v11 full-backup import/export, including clean-profile laboratory
  restoration. Earlier backups remain readable; old applications reject v11.
- Laboratory success is displayed after the IndexedDB write completes. Failure
  retains form input, and concurrent writes are serialized by the view.
- Licensed MP4/WebM manifest and real player controls, playback speed, replay,
  actual decoded dimensions, source cleanup and GIF fallback. Manifest is empty
  until redistribution rights exist; 180px GIFs are not described as HD.
- Today spacing/wrapping and Tools hash-navigation repair.
- Build-time resolution of obsolete translation overrides and removal of unused
  older timer/import implementations, with unchanged resource budgets.
- First library image loads eagerly with high priority. Other images remain lazy.
- PWA precache retains generated modules and the raw modules actually used by
  bootstrap/Tools. It removes 44 duplicate authored URLs (693,471 authored bytes),
  and known-offline navigation attempts the cached shell before a network fetch.
  Cross-engine connection-loss tests close real origin connections per browser
  context and prove an uncached fetch fails before testing cached routes.
- Pages assembly writes the exact quality-checked SHA to public `release.json`.

## Evidence

- `npm run quality`: build, syntax, budgets and 175 unit tests pass.
- Initial local full behavior run: 200 pass, 3 existing skips, one WebKit test
  preparation race. Its corrected boot/persistence synchronization passes on retry.
- Twelve local new-feature checks passed across Chromium desktop/mobile, Firefox
  and WebKit, including real VP8 decoding and clean-profile backup restoration.
- Responsive proof: 297 route/theme/width checks, no horizontal overflow;
  108 screenshots at selected widths. This is not a human usability study.
- [Linux Quality generation run](https://github.com/castefeudal/gymdo/actions/runs/40137775929)
  passed all six jobs for `98989dc`. Its 218 Linux visual candidates were reviewed
  before acceptance. Timer masks in regression captures are test-only.
- Later persistence/offline and normal CI results must be read from PR checks;
  they are not implied by the earlier generation run. Windows WebKit offline
  protocol emulation encountered an internal browser error during local verification.
  The real-origin connection-loss scenario subsequently passed locally in all
  four browser configurations, including WebKit, with an uncached failure probe.
  Network requests that remain pending fall back to the installed shell after
  three seconds; direct worker tests cover pending/rejected fetches and cache
  write failure without discarding a valid online response.
  A brief failed-origin backoff prevents dependent imports from repeating the
  timeout. The browser fixture holds connections for five seconds before
  dropping them, exercising pending requests rather than immediate rejection.

## Published-site Lighthouse baseline

The audited public site was r73, not the draft r74 code. Lighthouse 13.5.0,
default mobile/desktop presets, three runs per route/device; all runs retained.

| Route | Mobile Performance | Desktop Performance | Accessibility / Best Practices / SEO |
| --- | ---: | ---: | --- |
| Today | 81 | 99 | 100 / 100 / 100 |
| Library | 53 | 74 | 100 / 100 / 100 |

| Device / route | Median LCP, seconds | Median CLS | Median TBT, ms |
| --- | ---: | ---: | ---: |
| Mobile / Today | 2.723 | 0.0554 | 555 |
| Mobile / Library | 4.106 | 0.9336 | 416 |
| Desktop / Today | 0.527 | 0.0461 | 35 |
| Desktop / Library | 0.536 | 0.9501 | 36 |

The library's largest shift was its main content during initialization. The
candidate keeps initializing main content transparent and marks it `aria-busy`
while preserving layout geometry, then reveals it through the existing app-ready
state. This prevents
showing intermediate routes before hydration; the boot/error UI remains visible.
It has not been verified as a published-site CWV improvement.

A separate, unthrottled localhost Chromium observation at 1440 × 900 in fresh
contexts recorded cumulative layout shifts of 0.000111 for Today and 0.005137
for Library after readiness and font settling. This single local observation is
neither a production Lighthouse comparison nor field p75.

See [machine-readable medians](lighthouse-production-medians.json). Original
JSON/HTML reports are in the local `artifacts/lighthouse-production/` directory
and `artifacts/lighthouse-production.zip`. These are laboratory measurements.
No CrUX p75 or field INP data was collected; TBT is not INP. The Performance ≥90
target is not confirmed. No performance gain from the draft fixes is claimed.

## Remaining scope

Product/meal catalog and full meal diary, PDF extraction/OCR, calculated free
testosterone, complete longitudinal laboratory charts, the full requested
training/program customization audit, independent design scoring, human WCAG
review, final Windows visual baseline validation, final production benchmarks
and deployment have not been completed. HD exercise sources require rights.

Before/after and laboratory screenshots are stored alongside this record.
