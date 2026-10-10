# Rental workflow implementation checkpoint — 2026-10-10

PR 17 implements the approved rental rules and in-memory staff/customer simulation. It remains open for review; merge is not authorized.

## Item status

| Item | Status | Evidence / remaining work |
|---|---|---|
| 1 · Baseline review | Complete | Existing readiness behavior retained; baseline tests rerun in this increment. |
| 2 · Rental eligibility | Implemented and verified for the scoped demo | Structured evaluation, policies/warranty/service timing, protected intervals, holds, precedence, separate forecasts and replacement-segment validation. |
| 3 · Staff and Customer Service workflow | Simulation implemented and verified | Role/qualification gates, shared intake/customer checks, proposal, approval/acceptance, allocations, callbacks, technical completion/inspection/release and history. Live AI interpretation/generated explanation remains pending; runtime summaries are visibly labeled templates. |
| 4 · Portfolio evidence | Pending | Demonstration script and validation evidence are available below; edited video/case-study packaging remains separate work. |
| 5 · Final review/checkpoint | Checkpoint recorded; review/merge pending | No production deployment, reservation integration or merge performed. |

## Concrete record mapping

| Record | Source / runtime implementation |
|---|---|
| Maintenance assessment | `rental_workflow.maintenance_controls`, keyed by the existing maintenance ID; criticality, group, gate, policy/version, qualified assessment, warranty/task limits and evidence. |
| Policy | `rental_workflow.policies`, NRE-MNT-001 through 005, version `demo-1`; fictional seven-calendar-day/25-operating-hour maximum, with both limits applied. |
| Staff | `rental_workflow.staff`; sample identities, role and explicit task/inspection qualifications. |
| Hold | `rental_workflow.holds`; equipment/task, authority, reason/evidence and active state. |
| Rental request | `rental_workflow.rental_requests`; customer, type/capabilities/attachments, local timestamps/timezone, intended use, daily/total usage, explicit usage windows, logistics and shared intake/notes. |
| Customer verification | `rental_workflow.customer_checks`; Existing/New/Uncertain match, profile, billing, on-site and transport insurance results. Site-document verification is request-specific. |
| Existing commitment timing | `rental_workflow.reservation_timing`; explicit local pickup/return times. Confirmed/Hold commitments block; Proposed/Canceled/Complete do not. |
| Allocation | Session state: protected equipment/request segments, temporary/confirmed/canceled/expired status, creation, four-hour expiry and approval scope. |
| Service / replacement | Session service/swap plans: schedules, evidence, confirmations, equipment segments, transport/handoff, downtime/instructions, Manager approval and request scope. |
| Evaluation | Independent current readiness under applicable evidenced policy limits, requested-period outcome, all accumulated findings, evidence, actions, conditions, separate forecast and recorded projected completion. |
| Decision / callback | Session records: actor/time, equipment/request/task/hold references, reason, evidence/scope; callback contact/update time, deterministic reviewer, CS owner, disposition/result and customer-update closure. |

The core snapshot schema remains 1.0 with required additive rental-workflow groups. `validateRentalDataset` validates the source at entry; the original Equipment Readiness API remains reusable and unchanged. Rental time rules use an explicit clock. State commands clone before mutation and validate before returning; failed commands leave the prior state intact.

## Reviewed fictional source changes

The existing private working Sheet was updated and read back before refreshing the application snapshot. Seven supplemental tabs carry the controls above; source guides document their purpose. All seven original equipment IDs/scenario IDs, original inspection/maintenance relationships and service schedules were preserved.

- MNT-3001 and MNT-3005 illustrative service names now match their existing 1,000/1,100-hour thresholds. These are fictional demo labels, not manufacturer specifications.
- MNT-3003/MNT-3006 are safety-critical; MNT-3001/3002/3004/3005 are operationally critical; MNT-3007 is the deliberately fictional noncritical periodic example with explicit assessment and warranty permission. Classification follows purpose/consequence, not the word routine.
- Warranty references/limits are explicit fictional task controls. Model year does not establish coverage. Generator warranty permits no operation past the mandatory limit; the documented next service threshold is fictional.
- SCN-004 usage windows reach 20 operating hours before the September 15, 10 AM service, with no further use until the 12 PM finish. Daily hours alone never supply an invented exact service clock time.
- SCN-006 now returns Remediation Required for known repair/hold while retaining contradictory evidence for Manager review.
- SCN-007 equipment returns Rental Ready; pending site paperwork separately blocks agreement confirmation.
- New request buffers use two-hour defaults. Existing reservation buffers remain longer recorded values (4/8/12 hours), so source commitments are not shortened.

Tests use isolated clones for changed states and replacement-unit scenarios. The application has one reviewed dataset; test spare units are not new source inventory or automatically offered equipment.

## Validation

Verified locally on Node 24.19.0:

- `npm test`: 75 tests pass, including all eight accepted readiness paths and eight Customer Service paths, plus boundary/authority/precedence/unknown-evidence cases.
- `npm run lint`: passes without warnings.
- `npm run typecheck`: passes.
- `npm run build`: production static build passes.
- `npm run test:ui`: production browser walkthrough passes for existing-customer approval/acceptance, confirmed timer retention, service disclosure/decline, qualified inspection/routine release, four-hour expiry, separate customer verification, desktop/mobile overflow and browser page errors.
- Desktop 1440 × 1050 and mobile 390 × 844 screenshots were visually inspected. No horizontal overflow or page errors.
- `git diff --check`: passes.

Browser verification used Playwright 1.62.1 with an installed Chromium executable. The standard browser download was unavailable in this environment; a temporary packaged Chromium was used instead. No production dependency or runtime browser integration was added. A stale generated build cache caused an initial build failure; preserving it outside the checkout and rebuilding cleanly resolved it.

The source Sheet values and native wrapping/header metadata were checked through connector readback. A separate Google-rendered visual review was not performed.

## End-to-end demonstration

1. Open Customer Service. Clock begins September 5, 2026, matching the source scenarios. Enter an explicit decision reason and evidence reference.
2. SCN-001: qualifying EQ-1001 is automatically proposed. Protect for four hours, approve the proposal, then record customer acceptance. The allocation converts to Confirmed without releasing assignment. Advance four hours: confirmed protection remains.
3. SCN-002: EQ-1002 remains blocked for its missing post-rental inspection/hold. As sample Mechanic/Inspector, record completed safety checks; as qualified Mechanic, release the selected routine hold. Customer Service reevaluates and can allocate the now-qualifying unit. Advancing four hours expires an unaccepted allocation while retaining draft/intake/notes.
4. SCN-004: inspect service evidence and the recorded stop. Protect and approve, then accept the disclosed interruption; or record customer decline, which releases temporary protection and excludes this unchanged option. Required service cannot be waived.
5. SCN-006: use a callback while technician/evidence resolution is pending. Manager review does not release the hold. Qualified Mechanic records completed repair; qualified inspector records passed checks; Manager reconciles evidence and releases the exception hold. Reevaluation establishes eligibility. A callback stays open until its CS owner records the customer update, including an unfinished-review update at the agreed time.
6. SCN-007: equipment eligibility passes while customer site documentation remains Pending. Complete the existing verification process through sample records; approval/acceptance remains blocked until mandatory checks pass.
7. Edit request dates, usage, notes or buffers to see reevaluation and approval invalidation. Exact IDs/serials and constrained equipment terms are supported; ambiguous “lift” results require confirmation.
8. Replacement plans are evaluated against both units/segments, service limits, confirmed transport, downtime and acceptance. The seeded inventory offers no invented spare. Executable swap tests prove both-unit protection and the no-additional-pickup/delivery-charge assumption while retaining the rental charge.

## Control details and follow-ups

- Qualified work completion never releases a hold. Critical work creates a post-work inspection/release hold if one is not already active. Routine release requires appropriate qualifications, technical evidence, passing checks and no unresolved exception; one release leaves other holds intact.
- Manager approval cannot waive safety, mandatory service, task or warranty limits. A permitted noncritical deferral adjusts only the evidenced applicable service limit for evaluation, leaving original due data/work status intact. Safety findings and holds still block.
- Required work/checks/release after preparation start requires revised pickup. Past appointments without verified completion remain blocking.
- Automatic ranking prefers verified ready units, then eligible conditional units with less recorded interruption, with stable ID ties. Pending completion plans are forecasts, not eligible allocations.
- Advance requests have no five-/30-day booking cap. An intervening future commitment can change usage and required post-rental evidence; the demo routes that uncertainty for review rather than inventing a future meter or inspection.
- This is an in-memory simulation with sample authority checks, not authentication or an actual operational stop/dispatch system. Reload resets state. Existing customer/new-customer policies are assumed working; no CRM registration or insurance policy is newly defined.
- Live AI interpretation/explanations, nearby-branch distance ranking, automatic alternative-date enumeration, detailed future reservation lifecycle, post-confirmation cancellation and production dispatch remain follow-up scope. The AI/rules/human boundary remains in force.
- Future Mechanic expansion must reuse the shared task/policy/warranty/qualification/inspection/hold/decision fields and technical-to-release trace.
