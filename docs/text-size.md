# Text-size preference

Settings → Text size offers Small (87.5%), Medium (100%, default) and Large (125%) on mobile and desktop. The choice applies immediately, survives reloads in `mmg.settings.v1`, is restored before stylesheet paint and travels with local backups. Existing `comfortable` preferences remain supported.

The stylesheet build converts legacy pixel font sizes and minimum text tokens to relative units without scaling layout spacing. Large text uses two-row desktop navigation up to 1749px. The service-worker release is advanced so installed/offline clients receive the new assets.

Validation: `npm run quality`; Playwright `text-size.spec.mjs` checks all sizes, reload persistence, RU/EN labels and page overflow across nine sections at 320/390/768/1440px. `header-layout.spec.mjs` covers navigation at intermediate widths. Physical-device testing is separate from browser viewport tests.
