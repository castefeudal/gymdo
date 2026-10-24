# Local laboratory journal

`#labs` stores original reported values, units, dates, time, laboratory, method,
context and report-specific reference bounds. It supports edit and confirmed
deletion. Records use the shared IndexedDB application-state adapter and are
included in verified full backups under `labResults`.

Malformed imported collections fail atomically. Invalid existing collections
remain untouched and request export/recovery. Missing reference bounds remain
unclassified. An interval comparison is arithmetic, not a diagnosis or medication
recommendation. No population normal ranges are inserted automatically.

Comparison uses the previous measurement of the same marker in the same named
laboratory and method. Original unit systems remain visible. Supported conversion
factors are marker-specific. Prolactin and HbA1c do not cross unit systems; no
assay-independent factor is assumed. Empty method/laboratory fields cannot prove
that methods match: users must consult the source reports.

Sources checked 2026-10-25:

- [Mayo Clinic Laboratories SI conversion](https://www.mayocliniclabs.com/order-tests/si-unit-conversion.html)
- [NIDDK A1C test and limitations](https://www.niddk.nih.gov/health-information/diagnostic-tests/a1c-test)

Same-day training and nutrition coverage is descriptive. It does not establish a
causal relationship. Native interval meters show relative position. A longitudinal
chart, PDF extraction, OCR, calculated free testosterone and report-file import
are not implemented in this increment. Full-app JSON backup is the import/export
path. These omissions must not be presented as a completed laboratory brief.
