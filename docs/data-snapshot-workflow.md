# Northstar Ridge Demo Data Workflow

## Authoritative workflow

As approved on October 11, 2026, `data/northstar-ridge-demo-data.json` is the
authoritative, editable dataset for **Northstar Ridge Equipment Readiness Demo Data**.
The application and automated tests consume this same version-controlled file.
Data edits are reviewed through pull requests; no export or Google Drive
synchronization is required.

> repository JSON edit → validation and PR review → application and tests

The former private Google Sheet is a historical copy, not an active source.
This decision does not delete, modify, or change sharing permissions on the Sheet.
Its earlier source role remains documented in dated checkpoints.

Preserve established identifiers, relationships, dates, and scenario intent unless
an intentional change is explained and reviewed in the pull request. Do not create
a parallel application dataset.

## JSON normalization rules

Apply these rules when editing the dataset:

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
  New records should follow the established group order; do not reorder records merely
  for convenience. Stable ordering makes dataset diffs reviewable.

## Reviewing a future update

1. Edit the authoritative JSON file on a working branch. Explain the intended
   data changes and any changed scenario expectations in the pull request.
2. Apply the normalization rules above; do not add a parallel dataset.
3. Review the JSON diff for only the intended changes. Confirm identifiers,
   equipment/customer relationships, inspection/maintenance links, reservation
   links, dates, timestamps, ordering, and demo-scenario intent remain intact.
4. Run `npm test` to validate the full committed dataset, then run `npm run lint`,
   `npm run typecheck`, `npm run build`, and `git diff --check`.
5. Submit both the reviewed dataset change and any deliberately necessary validator
   change through normal pull-request review. Never weaken validation solely to make
   an unintended source-data change pass.

The validator is deterministic: it checks representation and referential integrity
without comparing records with the current system date.

The Equipment Readiness engine validates this snapshot through the established
validator before evaluation. Unlike snapshot validation, readiness time rules require
an explicit caller-supplied as-of date; they never use the system clock. The engine
does not mutate the snapshot or connect to the private Sheet.


## PR 17 record mapping and historical provenance

The core schema remains 1.0; the additive `rental_workflow` groups are required by `validateRentalDataset` at the demo entry point. The former Sheet tabs Delay Policies, Maintenance Controls, Demo Staff, Operational Holds, Customer Checks, Rental Requests and Reservation Timing originally supplied the corresponding nested arrays. Future edits happen directly in those JSON arrays. Policy versions use `demo-1`. Request usage/intake and staff qualifications are native JSON objects/arrays. Preserve booleans/numbers and use null for absent control limits.

Seeded periodic service names were reconciled with existing due-hour thresholds; equipment IDs, inspection/maintenance links and schedules were preserved. SCN-006 now follows the approved repair-over-review precedence while retaining contradiction evidence. SCN-007 equipment is eligible while site-document verification separately gates acceptance. The generator usage windows document 20 hours before the scheduled service and no operation during the stop; no invented exact threshold clock time is used. Its documented next-hour limit is fictional, not a manufacturer specification.

Session work/inspection decisions, allocations, callbacks, acceptance and history are simulated operational records derived from the reviewed source; they do not write back to or replace the authoritative JSON file. Tests mutate isolated clones to exercise alternative states and replacement-unit scenarios; they do not introduce a second application dataset. Future Mechanic work must reuse the shared task, policy, warranty, qualification, inspection, hold and decision references.

## Data security boundary

Keep the dataset fictional and public-safe. Do not commit real customer identities,
billing details, actual insurance documents, credentials, employer-confidential
information, or private-resource links. Treat browser-delivered demo data as visible
to demo users. Repository access controls do not make bundled browser data private,
and deleting a file later does not remove its previous contents from Git history.
