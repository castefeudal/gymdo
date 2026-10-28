# Production Lighthouse — r75.3 navigation release

Measured on 2026-10-28 after GitHub Pages published merge commit `36b22189da6ad1832bddc594df3f833a337c759c`. The public `release.json` matched that full SHA. Lighthouse 13.5.0 ran three sequential measurements for Today, Library, and Labs in mobile and desktop presets. Source reports are retained locally in `artifacts/lighthouse-production-36b2218/` and are not committed.

| Mode | Route | Performance | Accessibility | Best Practices | SEO | LCP median | CLS median | TBT median |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | Today | 93 | 100 | 100 | 100 | 2.845 s | 0.0000 | 20 ms |
| Mobile | Library | 84 | 100 | 100 | 100 | 3.820 s | 0.0000 | 84 ms |
| Mobile | Labs | 92 | 100 | 100 | 100 | 3.060 s | 0.0000 | 45 ms |
| Desktop | Today | 100 | 100 | 100 | 100 | 0.681 s | 0.0031 | 0 ms |
| Desktop | Library | 99 | 100 | 100 | 100 | 0.784 s | 0.0053 | 0 ms |
| Desktop | Labs | 100 | 100 | 100 | 100 | 0.667 s | 0.0031 | 0 ms |

These are lab measurements, not field Core Web Vitals. Mobile LCP exceeds the 2.5 s target on every route. The Library route also misses the mobile Performance target. TBT is not INP. Lighthouse and Axe scores do not replace manual WCAG 2.2 AA, screen-reader, or task-based usability reviews.

The first large content item was route-specific text on Today and Labs, and the first exercise preview on Library. Experiments with parallel startup loading and GIF preloading were rejected after local Lighthouse runs regressed Library and Labs LCP. No optimization is reported as successful without a repeatable improvement.

## Publication proof

- Merge commit: `36b22189da6ad1832bddc594df3f833a337c759c`.
- Quality run `40606905784`: passed.
- GitHub Pages deployment `40607514580`: passed for the exact merge SHA.
- Public `release.json`: matched the exact merge SHA.
- `scripts/check-live.mjs`: passed 480 route/theme/language/viewport combinations; 37 deployed artifacts matched Git blobs; OCR and installed offline boot passed.

## Remaining human validation

- Task-based usability sessions with the three requested participant profiles have not been conducted.
- Manual screen-reader, keyboard, zoom, and assistive-technology review against WCAG 2.2 AA has not been conducted.
- Field CWV and INP were not collected.
