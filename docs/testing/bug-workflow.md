# Bug tracking workflow

This is the lightweight bug process for the Northstar Ridge demo. Keep the
[bug log](bug-log.md) as the single tracking record and use pull requests as the
reviewable implementation record. No separate tracker is required.

## Lifecycle

| Status | Meaning | Evidence needed to move forward |
|---|---|---|
| Open | Reported and awaiting work; reproduction may be pending or confirmed. | Record expected/actual behavior, affected version, reproduction, impact and priority. |
| In progress | A named implementer is working on the fix. | Record owner, proposed approach and linked PR. |
| Ready for review | Fix and regression coverage are implemented and verified. | Link fix commit and tests; record actual validation results. |
| Closed | Fix was reviewed, approved and merged. | Record reviewer, verification evidence and merge commit/date. |

If verification fails or a closed bug returns, move it back to Open and append
the new evidence to its history. Preserve the earlier record.

## Working steps

1. **Record and reproduce.** Give the bug a stable ID. Capture the trigger,
   expected result, actual result and commit where it was observed. Reproduce
   against an isolated copy of fictional demo data.
2. **Triage.** Set priority and decide whether it blocks merging. Name the
   implementer when work starts. Keep proposed fixes separate from completed fixes.
3. **Fix.** Add a focused regression test that fails on the affected version,
   implement the correction, and link the test and fix commit in the bug record.
4. **Verify and review.** Confirm the reproduction now passes, relevant existing
   behavior still passes, and applicable lint/typecheck/build/browser checks pass.
   Record what actually ran. Obtain PR review and Andy's merge authorization.
5. **Close.** After merging, record the merge commit and closure date. Closure
   means merged and verified; it does not imply deployment. If deployed later,
   record that separately.

The owner of a bug maintains its record as part of the fix PR. The reviewer checks
that the evidence supports the status. Andy controls the merge decision.

## Minimum bug record

Use the fields illustrated in the [two example records](bug-log.md):

- ID/title, status, priority, merge impact and owner.
- Reported date, affected commit and linked PR.
- Expected/actual behavior and reproducible steps.
- Proposed fix and regression acceptance criteria.
- Fix commit, verification, reviewer and closure/merge evidence.
- Short chronological history.

Use P1 for a broken safety/required-control boundary, P2 for incorrect
availability or workflow behavior, and P3 for presentation defects without a
control failure. Priority is reviewed when impact changes.

## Demonstrating the process

Start with NRE-BUG-001 and NRE-BUG-002, currently Open with confirmed reproductions.
Show the original failing behavior, update a record as its fix is implemented,
then show the same scenario passing and the regression test protecting it.
Compare the affected commit with the fix commit in PR 17. Close the record only
after review and authorized merge. Do not manufacture a completed lifecycle.

Application walkthrough acceptance and bug closure are separate evidence:
successful walkthroughs do not replace regression checks for newly found cases.
