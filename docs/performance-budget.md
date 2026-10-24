# Production performance budgets

Run npm run quality to regenerate production assets and check raw/gzip budgets.

| Asset | Raw limit | gzip limit |
| --- | ---: | ---: |
| Authored app.js | 446,000 B | 127,000 B |
| Single compiled app.css | 272,000 B | 48,500 B |
| Deferred markup ui.html | 117,000 B | 28,000 B |
| Initial index.html | 10,000 B | 4,000 B |
| All compiled runtime chunks | 480,000 B | 160,000 B |
| Lazy LAB gym-tools.js | 50,000 B | 16,000 B |

The entry preloads compact markup and runtime. Mounting markup before initialization preserves DOM bindings. This reduces the initial document; markup still transfers on first launch. It does not eliminate total HTML transfer.

Esbuild emits ESM runtime with split dynamic imports. LAB, methods and secondary engines retain lazy loading. The service worker precaches generated chunks and markup for offline launches. Installation downloads these intentionally; media is cached on demand. Budgets cover every generated runtime chunk. CI checks generated-asset drift.

The results workspace loads its view only on `#labs`. Laboratory validation is
shared with backup import. Production catalog generation resolves historical
overrides at build time and omits an audited list of retired markup keys while
retaining source compatibility. Reintroducing one of those keys into ui.html or
app.js automatically retains it in the production catalog. Superseded timer and
unsafe legacy import implementations were removed; deadline timing and verified
import remain canonical. These changes preserve the existing runtime budget.
