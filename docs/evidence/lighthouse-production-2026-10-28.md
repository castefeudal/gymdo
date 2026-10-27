# Production Lighthouse measurement — 2026-10-28

Measured after the successful Pages deployment for merge commit `ac6ef83971a90de9fcf25695fa644f1d15c1970d`. The public `release.json` matched this full SHA before measurement. Lighthouse 13.5.0 ran three sequential times per route and form factor using the repository's `scripts/measure-production.ps1` procedure. These are lab measurements, not field p75 or INP.

| Form factor | Route | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | Today | 93 | 100 | 100 | 100 | 2.875 s | 0.0000 | 21 ms |
| Mobile | Library | 89 | 100 | 100 | 100 | 3.092 s | 0.0000 | 253 ms |
| Mobile | Labs | 93 | 100 | 100 | 100 | 2.844 s | 0.0000 | 46 ms |
| Desktop | Today | 100 | 100 | 100 | 100 | 0.632 s | 0.0023 | 0 ms |
| Desktop | Library | 99 | 100 | 100 | 100 | 0.682 s | 0.0045 | 0 ms |
| Desktop | Labs | 100 | 100 | 100 | 100 | 0.660 s | 0.0023 | 0 ms |

Values are medians of three Lighthouse JSON reports in the local ignored directory `artifacts/lighthouse-production-ac6ef839/`. Mobile performance reached 90+ on Today and Labs but not Library. Mobile LCP remains above the 2.5 s target on all three routes. Desktop scores are 99–100. CLS is below 0.1 in every sample. TBT is a lab metric and must not be reported as INP. Accessibility score 100 does not replace manual WCAG 2.2 AA and assistive-technology validation.

## Release proof

- Merge commit: `ac6ef83971a90de9fcf25695fa644f1d15c1970d`.
- Pages deployment run `40595202567` completed successfully.
- Public `release.json` matched the merge SHA.
- `scripts/check-live.mjs` passed all 480 route/theme/language/browser combinations, verified 37 published artifacts against Git blobs, and passed OCR plus installed offline boot.

## Remaining evidence gaps

- Three-profile task-based usability research was not conducted.
- Manual screen-reader, zoom, keyboard, and assistive-technology review against WCAG 2.2 AA was not conducted; automated Axe and Lighthouse checks are not a substitute.
- Mobile LCP remains above the stated 2.5 s goal and mobile Library performance is 89. Field CWV/INP were not collected.
