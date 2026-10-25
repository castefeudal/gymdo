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
causal relationship. Native interval meters show relative position. Longitudinal
charts separate laboratory, assay and incompatible units and expose exact values
in an accessible table.

PDF.js extracts local report text. Tesseract recognizes Russian/English scans
locally, using bundled engines and language models. Nothing is uploaded. Optional
engines are fetched only when used and cached by the service worker. Limits:
15 MB/file, 20 text pages, 5 OCR pages. OCR is fallible; raw text remains editable.
Conservative marker suggestions require a known unit and an exact value; inequality
results are not silently coerced. A suggestion fills the manual form, clears the
date and requires explicit review/save. It never creates a trusted measurement.

Calculated free testosterone uses the Vermeulen equilibrium approximation and
ISSAM constants. It requires exactly one testosterone/SHBG/measured albumin record
on the selected date, matching time/laboratory and an explicit confirmation of one
draw, adult male and no stated exclusions. No default albumin is invented. The
estimate remains separate from measured history and never recommends treatment.
The ISSAM 13.1 nmol/L testosterone, 50 nmol/L SHBG, 43 g/L albumin example is
checked at approximately 202 pmol/L free testosterone.

- [ISSAM calculator and limitations](https://www.issam.ch/freetesto.htm)
- [Mozilla PDF.js](https://mozilla.github.io/pdf.js/examples/)
- [Tesseract local deployment](https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md)
