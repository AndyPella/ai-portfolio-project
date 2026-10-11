# Northstar Ridge bug log

This log tracks reported bugs, fix evidence and closure using the
[bug workflow](bug-workflow.md). Both examples were discovered during the
October 11, 2026 review of [PR 17](https://github.com/AndyPella/ai-portfolio-project/pull/17).
The six accepted walkthroughs cover the usual paths; these findings expose
additional boundary cases.

## Current queue

| Bug | Priority | Status | Reproduction | Merge impact | Owner | Fix PR |
|---|---|---|---|---|---|---|
| [NRE-BUG-001](#nre-bug-001) · Inspection before work releases post-work hold | P1 | Open | Confirmed | Blocks merge | Unassigned | PR 17 |
| [NRE-BUG-002](#nre-bug-002) · Replacement delivery overlaps another allocation | P2 | Open | Confirmed | Blocks merge | Unassigned | PR 17 |

The proposed corrections below are not implemented yet. At discovery, all 75
existing tests passed; neither reproduced case was covered. GitHub had no
automated check results attached to the reviewed head.

## NRE-BUG-001

**Title:** Inspection recorded before critical work can release a post-work hold.  
**Status:** Open · confirmed reproduction  
**Priority:** P1 · required safety-control sequence  
**Reported:** October 11, 2026  
**Owner:** Unassigned  
**Affected commit:** `c920b2ec4189fc5fe4b2c7b12c25a6d9593e5289`  
**Review/fix PR:** [PR 17](https://github.com/AndyPella/ai-portfolio-project/pull/17)  
**Code:** [post-work inspection check](https://github.com/AndyPella/ai-portfolio-project/blob/c920b2ec4189fc5fe4b2c7b12c25a6d9593e5289/domain/rental-workflow.ts#L604)

### Reproduce

Use an isolated clone of the committed dataset with a fresh rental state.
Run these commands through `applyWorkflow` as qualified `DEMO-MECH`, with
nonempty reason and evidence, using the same clock value for all three:

`2026-09-05T09:00:00-07:00`

1. Record `Pass inspection` for EQ-1001 with validity through December 31, 2026
   and next inspection limit 2,000 operating hours.
2. Record `Complete work` for MNT-3001. This creates a post-work hold.
3. Record `Release hold` for that newly created active hold.

**Expected:** Step 3 is rejected until a qualified inspection is recorded after
the work completion action.

**Actual:** Step 3 succeeds using the earlier inspection because its timestamp
equals the work timestamp. The inspection, work and release history confirms
the incorrect action order.

**Cause:** The release check accepts inspection timestamps greater than or equal
to the work timestamp, without checking which action happened first. The demo
clock can assign the same timestamp to several successive actions.

### Proposed fix and acceptance criteria

Use the recorded decision order to require a qualified inspection after the
latest completion of the held task. A strict timestamp comparison alone would
also reject legitimate work-then-inspection actions within the same clock tick.

Regression coverage must prove:

- Inspection then work at the same timestamp cannot release the hold.
- Work then inspection at the same timestamp can satisfy the sequence, provided
  all other controls pass.
- Repeating work invalidates inspections recorded before that latest completion.
- Other active holds and authority requirements still apply.

### Fix and verification

- Fix commit / regression test: Pending.
- Verification / reviewer: Pending.
- Merge commit / closure date: Pending.
- Deployment: No deployment performed.

### History

| Date | Status | Evidence / decision |
|---|---|---|
| October 11, 2026 | Open | Review reproduced release using an inspection recorded before work at the same timestamp; classified P1 and blocks merge. |

## NRE-BUG-002

**Title:** Replacement protection omits the interval before handoff.  
**Status:** Open · confirmed reproduction  
**Priority:** P2 · incorrect availability / overlapping allocation  
**Reported:** October 11, 2026  
**Owner:** Unassigned  
**Affected commit:** `c920b2ec4189fc5fe4b2c7b12c25a6d9593e5289`  
**Review/fix PR:** [PR 17](https://github.com/AndyPella/ai-portfolio-project/pull/17)  
**Code:** [replacement segment timing](https://github.com/AndyPella/ai-portfolio-project/blob/c920b2ec4189fc5fe4b2c7b12c25a6d9593e5289/domain/rental-workflow.ts#L142)

### Reproduce

Use the isolated `swapCase()` fixture in `tests/rental-workflow.test.mjs`.
Its TEST-SPARE is a test-only copy of the generator, not a new application record.
Keep its qualified replacement, valid inspection, original/replacement usage
and confirmed logistics.

1. Set replacement delivery to September 10, 2026 at 9 AM Pacific.
2. Leave handoff and original collection at September 12 at 9 AM Pacific.
3. Add another request's Confirmed allocation for TEST-SPARE, protecting
   September 10 at 7 AM through September 11 at 5 PM Pacific.
4. Evaluate the swap as of September 5 at 9 AM Pacific.

**Expected:** The plan is ineligible because the replacement is already
allocated when it must be delivered.

**Actual:** `evaluateSwap` returns `eligible: true`. Its replacement protected
interval starts September 12 at 7 AM Pacific, so the September 10 delivery
conflict is missed.

**Cause:** Replacement evaluation starts at handoff and applies preparation
relative to handoff, overlooking an earlier delivery.

### Proposed fix and acceptance criteria

Check and protect the replacement from preparation before the confirmed delivery
through return/turnaround. Preserve the handoff as the usage transition so early
delivery does not invent operating hours or change service calculations.

Regression coverage must prove:

- An allocation overlapping early delivery makes the swap ineligible.
- Successful swap allocation protects the early delivery interval.
- Exact protected-interval adjacency remains allowed.
- Ordinary same-time delivery/handoff still works.
- Both units, service limits, downtime, customer acceptance and the existing
  no-additional-pickup/delivery-charge assumption remain enforced.

### Fix and verification

- Fix commit / regression test: Pending.
- Verification / reviewer: Pending.
- Merge commit / closure date: Pending.
- Deployment: No deployment performed.

### History

| Date | Status | Evidence / decision |
|---|---|---|
| October 11, 2026 | Open | Review reproduced an eligible swap despite a Confirmed allocation during replacement delivery; classified P2 and blocks merge. |
