# Local food diary

The nutrition route now contains a searchable user catalog, favorites, label-based
products, gram/serving entry, saved meals, repeat previous meal, editing/deletion,
and calendar day/week/month history. Energy and macros are deterministic sums of
entered per-100g values. No fabricated catalog values or external API are used.
Source/label attribution is required in the editor. Saved recipes preserve the
combined composition and weight of the selected meal.

Entries retain independent food snapshots. Editing or deleting a catalog product
does not rewrite historical consumption. The structured collection is persisted
through the existing IndexedDB application-state adapter and included atomically
in schema-v12 full backups. Earlier backup versions remain importable; older
applications reject newer envelopes rather than silently dropping food records.

An incomplete food day is not automatically published as full daily consumption.
The explicit Day complete action confirms replacement of the legacy daily total
and feeds existing calorie/weight trend and adaptive expenditure tools. The user
can continue entering legacy day totals directly. Empty dates are not zero intake.
Period averages use days with entries and clearly report coverage. Weight changes
remain recorded observations, not proof that a meal caused a body-weight change.

Product/entry validation is atomic, finite, date-aware and bounded. Durable-write
failure retains input rather than reporting success. Concurrent saves are serialized.
