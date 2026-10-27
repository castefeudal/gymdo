# Lighthouse candidate measurement — 2026-10-27

This is a local laboratory measurement of the rebuilt candidate, before merge or Pages deployment. It is not production proof, CrUX data, field p75, or a measurement of INP.

## Method

- Lighthouse 13.5.0; three sequential runs for each route and form factor.
- Routes: Today (`#home`), Library (`#library`), and Labs (`#labs`).
- Lighthouse mobile and desktop presets, simulated throttling (`throttlingMethod: simulate`).
- Local static server at `http://127.0.0.1:4173/`, with gzip enabled; Chromium for Testing 140.0.7339.16.
- The script retained the original JSON and HTML reports locally under the ignored `artifacts/lighthouse-candidate-2026-10-27/` directory and wrote category medians to `medians.json`.
- Metrics below are medians of three runs; LCP is seconds, CLS is unitless, and TBT is milliseconds.

## Results

| Form factor | Route | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Mobile | Today | 86 | 100 | 100 | 100 | 3.647 s | 0.0000 | 19 ms |
| Mobile | Library | 81 | 100 | 100 | 100 | 4.069 s | 0.0000 | 82 ms |
| Mobile | Labs | 84 | 100 | 100 | 100 | 3.970 s | 0.0000 | 36 ms |
| Desktop | Today | 98 | 100 | 100 | 100 | 0.995 s | 0.0004 | 0 ms |
| Desktop | Library | 98 | 100 | 100 | 100 | 0.895 s | 0.0077 | 0 ms |
| Desktop | Labs | 99 | 100 | 100 | 100 | 0.864 s | 0.0057 | 0 ms |

## Interpretation and limits

- Desktop meets the specified Lighthouse category targets for these three routes.
- Mobile Performance does not meet the 90 target on any sampled route. Mobile LCP also exceeds the 2.5 s lab target on all three routes; investigate main-thread startup and the initial exercise catalogue before claiming the target.
- CLS is below 0.1 in all six route/form-factor medians. Low laboratory CLS is not a substitute for field measurement.
- TBT is reported because it is available in this Lighthouse lab run. It is not INP. No field INP or other Core Web Vitals were collected.
- Lighthouse Accessibility 100 is a lab category score; it does not replace manual WCAG 2.2 AA, screen-reader, keyboard, zoom, and assistive-technology review.
- Repeat the same method against the exact public release after Pages publication. Keep candidate and production reports separate.
