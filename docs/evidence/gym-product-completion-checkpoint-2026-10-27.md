# GYMDO product completion — working evidence (2026-10-27)

## Request and source brief

- User resumed the unfinished MARKOV MADE GYM master prompt and asked for all remaining work, commit, merge and production publication.
- Prompt file: `C:\Users\zasse\.codex\attachments\f2d907f4-313a-4684-97bb-b7da210f062f\Вставленный текст.txt`.
- Prompt SHA-256: `DE97EB887756FCF1C232BDE7559E877C65B2E9DCD3A2531EBFAC651B2B47CA40`.

## Repository and release state

- Repository: `D:\MARKOVMADEOS\gymdo`; remote: `https://github.com/castefeudal/gymdo`.
- Base branch/commit: `main` at `c53a793b4005a2a7e49dc94fbb145b5ee21c2e83`.
- Working branch: `codex/gym-product-completion`.
- Candidate commit: `27c4af498cb1594a27ab58e102170b4a348057d7` (`feat: add crash-safe backups and CKD-EPI estimate`); pushed to `origin/codex/gym-product-completion`.
- Draft PR #3: https://github.com/castefeudal/gymdo/pull/3. Follow-up documentation/schema-test/Linux-baseline changes are being prepared after the first CI result.
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
- Targeted import/Labs E2E rerun: 27/27 on Chromium desktop/mobile and Firefox, plus 9/9 on WebKit.
- `git -c core.whitespace=cr-at-eol diff --check` was used because the Windows checkout has `core.autocrlf=true`; rerun after final edits.

## Remaining release gates

1. Completed candidate validation: `npm run quality` passes 192/192 unit tests; targeted backup/Labs E2E passes 36/36 across Chromium desktop/mobile, Firefox and WebKit. Full branch Quality with `refresh_visual_baselines=true` passed as run `40494626097`; it produced the Linux artifacts. The initial PR Quality run `40495583851` passed foundation and all four behavior jobs but visual comparison failed on exactly the 18 Labs route snapshots. Those 18 reviewed Linux Labs PNGs are refreshed locally and `npm run visual -- --workers=3` passes 218/218. The ordinary PR Quality rerun must confirm the refreshed set.
2. Backup schema is 12 and imports earlier versions; `docs/domain-model.md`, `docs/quality-gate.md`, and the compatibility test have been brought up to date. Atomic cross-store cold-start restore is covered in E2E.
3. Lighthouse candidate medians remain lab data: mobile Performance 81–86 and LCP 3.647–4.069 s miss the prompt's 2.5 s LCP target; desktop Performance 98–99 and LCP 0.864–0.995 s. INP was not measured, and TBT is not INP. Production Lighthouse must be measured after publication.
4. Finish and push the reviewed snapshot/documentation commit, confirm every ordinary PR Quality job is green, then merge. Verify completed Pages deployment, public `release.json` equals the exact merge SHA, and `scripts/check-live.mjs` passes for that full SHA.
5. Master-prompt items requiring real human participation (task-based usability with three participant profiles and manual screen-reader/WCAG validation) remain open and cannot be claimed from automation. Do not claim full Definition of Done until those reviews and the performance target are resolved or accurately reported.

Do not claim a completed production release until those gates are evidenced.

## Pause checkpoint — 2026-10-27, latest session

- User asked to pause and continue later. Do not merge, publish, or close this work until resumed.
- Working tree is on `codex/gym-product-completion`, HEAD `28a22eae2b734abf8e96f4e3bcc05d51b74da1ec`, tracking the same remote SHA; all implementation, tests, generated assets, reviewed snapshots, and documentation changes are committed and pushed. The paragraph in this pause checkpoint itself is local-only and intentionally uncommitted, so updating it does not restart the active PR workflow.
- Open draft PR #3: https://github.com/castefeudal/gymdo/pull/3.
- Latest exact-HEAD PR Quality run: `40497627307`, https://github.com/castefeudal/gymdo/actions/runs/40497627307; completed successfully across foundation, Linux visual, Chromium desktop/mobile, Firefox, and WebKit.
- Full baseline-refresh Quality run `40494626097` passed all jobs on `27c4af498cb1594a27ab58e102170b4a348057d7`. Its artifact was accepted only after success; exactly 18 affected Labs Linux snapshots were copied. The new head adds only docs/schema-compatibility test and those 18 baselines to the implementation already covered by the complete baseline run.
- Local evidence on the current implementation: `npm run quality` passed 192/192; local visual matrix passed 218/218; targeted import/Labs E2E passed 36/36 across Chromium desktop/mobile, Firefox and WebKit.
- Next: make PR #3 ready; merge (explicitly authorized in the user's earlier request); wait for the Pages deployment; verify public `release.json` equals the exact merge SHA and run `scripts/check-live.mjs` with the full SHA. Then measure Lighthouse on production separately and update this checkpoint.
- Still open after release: mobile Lighthouse candidate LCP 3.647–4.069 s exceeds the 2.5 s target; field CWV/INP was not measured. Three-profile human usability research and manual screen-reader/WCAG 2.2 AA validation have not been conducted. Do not claim full Definition of Done or invent results.

## Resume and production release — 2026-10-28

- User resumed and authorized merging/publishing. Draft PR #3 was marked ready and merged: https://github.com/castefeudal/gymdo/pull/3. Merge commit is `ac6ef83971a90de9fcf25695fa644f1d15c1970d`.
- Exact-merge Quality run `40594577467` passed foundation, visual, Chromium desktop/mobile, Firefox, and WebKit.
- Pages deployment `40595202567` completed successfully. Public `release.json` reported the exact merge SHA.
- `scripts/check-live.mjs` passed: 37 published artifacts matched Git blobs; all 480 route/theme/language/browser combinations passed, along with generated-report OCR and installed offline boot. Results are in `artifacts/live-r75-1/results.json` (local ignored artifact).
- Production Lighthouse: 18 runs (3 per form factor and route) are in the local ignored `artifacts/lighthouse-production-ac6ef839/`; summary and interpretation are in `docs/evidence/lighthouse-production-2026-10-28.md`. Mobile Performance medians were 93/89/93 (Today/Library/Labs), desktop 100/99/100. Mobile LCP medians 2.875/3.092/2.844 s remain above 2.5 s.
- Product change is merged and live. Full prompt Definition of Done remains open: three-profile human usability research, manual WCAG 2.2 AA/screen-reader review, and mobile LCP (plus mobile Library Performance) target. Automated CI/live checks do not establish those human or performance criteria.
