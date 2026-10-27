# GYMDO product completion — working evidence (2026-10-27)

## Request and source brief

- User resumed the unfinished MARKOV MADE GYM master prompt and asked for all remaining work, commit, merge and production publication.
- Prompt file: `C:\Users\zasse\.codex\attachments\f2d907f4-313a-4684-97bb-b7da210f062f\Вставленный текст.txt`.
- Prompt SHA-256: `DE97EB887756FCF1C232BDE7559E877C65B2E9DCD3A2531EBFAC651B2B47CA40`.

## Repository and release state

- Repository: `D:\MARKOVMADEOS\gymdo`; remote: `https://github.com/castefeudal/gymdo`.
- Base branch/commit: `main` at `c53a793b4005a2a7e49dc94fbb145b5ee21c2e83`.
- Working branch: `codex/gym-product-completion`.
- Changes in this evidence file and source/build/test changes are local and not yet committed or pushed.
- No PR for this work exists yet.
- GitHub Quality run `40485591960` passed on the unmodified base commit, including foundation, Chromium desktop/mobile, Firefox, WebKit, and all 218 Linux visual checks. This proves the baseline, not the current candidate.
- At the prior checkpoint the latest verified Pages `release.json` was `a7855f06b3276fdb709f70f911b582ea8bea03df`. Recheck the public SHA after merge; do not infer deployment from CI or a merge alone.

## Candidate implementation in progress

- Added a prepared/committed backup import journal across LocalStorage and IndexedDB. On startup, a prepared journal restores touched local keys and IndexedDB collections before legacy migrations read state. Failed in-process restoration retains the journal for retry. Added interrupted cross-store cold-start coverage.
- Added the race-free 2021 CKD-EPI creatinine estimate as an optional dynamically loaded Labs calculator. It requires adult age, creatinine/unit, and the equation sex factor; inputs are not persisted. The result is explicitly an estimate, with standardized-creatinine, muscle-mass, cystatin-C, albuminuria, and chronicity limitations and links to NIDDK, the primary 2021 study, and KDIGO 2024.
- Equation and unit conversion were cross-checked against the NIDDK official implementation. Unit tests cover male/female vectors, SI conversion, and invalid/out-of-domain inputs. The calculator evidence model is recorded in `data/evidence/calculators.json`.
- Replaced file-import test navigation waits with the actual recovery status. Removed a WebKit header-layout wait on animation frames and extended that broad viewport sweep timeout for loaded runners.
- Reviewed and refreshed only Windows Settings snapshots where the density control had replaced the old logging block, and Labs snapshots where the new collapsed eGFR control was added. No pixel tolerances were changed.
- Updated the aggregate runtime JS byte budget by 5 KB raw / 1 KB gzip for this optional medical calculator; initial and complete-boot caps remain 480 KB / 482 KB. Measured build is 526,286/527,000 B aggregate and 481,591/482,000 B complete boot.
- Rebuilt production artifacts from canonical sources. The full exercise catalogue remains 1,324 records.

## Verified locally for the candidate

- `npm run quality`: passed syntax (78 modules), production build, all byte budgets, and 192/192 unit tests.
- Full visual matrix `npm run visual -- --workers=3`: passed 218/218 after the reviewed Windows snapshot refresh.
- Lighthouse candidate: 18 runs (three each for mobile/desktop × Today/Library/Labs) completed. Medians and limitations are in `docs/evidence/lighthouse-candidate-2026-10-27.md`; mobile Performance and LCP targets are not met. This is localhost lab evidence only.
- Targeted CKD-EPI E2E: passed 4/4 in desktop Chromium, mobile Chromium, Firefox, and WebKit.
- Recovery/lab suite: 32 checks passed across browser projects before a test-only Russian/English assertion mismatch; after fixing that locale expectation, the CKD-EPI case passed 4/4. Rerun the final combined targeted suite or rely on the full PR matrix before release.
- Food-diary, header-layout, and route Axe checks passed 26/26 in Firefox and WebKit after test wait fixes.
- A combined 36-case lab/backup run had 29 passes and 7 WebKit page-setup/boot timeouts while browsers were run concurrently. A fresh WebKit-only run with one worker passed all 9/9 lab and backup scenarios; desktop/mobile/Firefox had passed their relevant tests in the combined run. Full PR CI remains the release gate.
- A prior full local E2E run before the final fixes had 492 passed, 4 expected skips, and 10 failures: six reviewed Windows Settings snapshots (now fixed); Firefox/WebKit timeouts in food import, Axe and header layout (targeted browser suites now pass). The full behavior suite has not yet been rerun on the final candidate.
- `git -c core.whitespace=cr-at-eol diff --check` was used because the Windows checkout has `core.autocrlf=true`; rerun after final edits.

## Remaining release gates

1. Finish/review the working diff and run the targeted laboratory + interrupted-backup suite after the final test assertion fix.
2. Measure candidate Lighthouse (three runs per device and key route) with `scripts/measure-production.ps1`; preserve that as laboratory data and do not call it field Core Web Vitals. After publication, run it against production as a separate measurement.
3. Commit and push `codex/gym-product-completion`, open/update the PR, run the complete Quality matrix on the candidate, and correct all failures. The Linux Labs baselines still need a reviewed refresh: use the Quality `refresh_visual_baselines` workflow, download the artifact only after the complete workflow succeeds, copy just the reviewed Labs PNGs, then run ordinary comparison Quality.
4. Only merge after full candidate gates pass. Then verify completed Pages deployment, public `release.json` equals the exact merge SHA, and `scripts/check-live.mjs` passes for that SHA.
5. Master-prompt items requiring real human participation (task-based usability with three participant profiles and manual screen-reader/WCAG validation) cannot be claimed from automation. Record objective remaining gaps rather than inventing participant results.

Do not claim a completed production release until those gates are evidenced.
