# Northstar Ridge Data Snapshot Workflow

## Authoritative workflow

The private **Northstar Ridge Equipment Readiness Demo Data** Google Sheet is the
editable working source. The version-controlled
`data/northstar-ridge-demo-data.json` file is a reviewed, static snapshot of that
source and is the only dataset consumed by the application and automated tests.
The application does not connect to Google Sheets at runtime.

The data path is deliberately one way:

> private Google Sheet → reviewed JSON snapshot → application and tests

Record edits begin in the private Sheet. Do not edit the JSON as an independent
working dataset, create a replacement dataset, or invent replacement records. A
snapshot update must preserve established identifiers, relationships, dates, and
scenario intent unless the corresponding source change has first been reviewed in
the Sheet.

## Snapshot normalization rules

Apply these rules when exporting or preparing a snapshot:

- **Numbers:** Store numeric values as JSON numbers, never numeric strings.
- **Booleans:** Store boolean values as JSON `true` or `false`, never text or `0`/`1`.
- **Nulls:** Use JSON `null` for an absent optional value. Do not use an empty string
  where `null` is the normalized representation.
- **Dates:** Use calendar dates in `YYYY-MM-DD` format, without a time or timezone.
- **Timestamps:** Use ISO 8601 timestamps with seconds and an explicit `Z` or numeric
  timezone offset, for example `2026-09-10T08:00:00-07:00`.
- **Identifiers:** Preserve identifier spelling and case. Identifiers are strings,
  primary identifiers are unique within their record group, and foreign identifiers
  must resolve to an existing record in the snapshot.
- **Record ordering:** Keep top-level groups and records in their established order.
  New records should follow the Sheet's reviewed order; do not sort records merely
  for export convenience. Stable ordering makes snapshot diffs reviewable.

## Reviewing a future update

1. Make and review the proposed record changes in the private Google Sheet.
2. Export the full dataset and normalize it according to the rules above. Replace
   the committed snapshot; do not add a parallel dataset.
3. Review the JSON diff for only the intended changes. Confirm identifiers,
   equipment/customer relationships, inspection/maintenance links, reservation
   links, dates, timestamps, ordering, and demo-scenario intent remain intact.
4. Run `npm test` to validate the full committed snapshot, then run `npm run lint`,
   `npm run typecheck`, `npm run build`, and `git diff --check`.
5. Submit both the reviewed snapshot change and any deliberately necessary validator
   change through normal pull-request review. Never weaken validation solely to make
   an unintended source-data change pass.

The validator is deterministic: it checks representation and referential integrity
without comparing records with the current system date.

The Equipment Readiness engine validates this snapshot through the established
validator before evaluation. Unlike snapshot validation, readiness time rules require
an explicit caller-supplied as-of date; they never use the system clock. The engine
does not mutate the snapshot or connect to the private Sheet.
