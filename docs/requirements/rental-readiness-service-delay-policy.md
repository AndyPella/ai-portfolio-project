# Rental Readiness and Service Delay Requirements

- Date: 2026-10-08
- Status: Agreed requirements captured for PR review; implementation pending
- Applies to: Northstar Ridge Equipment Group, read-only Rental Availability
- Baseline reviewed: main at 550ea4bb8a0551eb80e084e5bf4c86d9aa46c5fb

## Ready to Rent

The equipment has passed all required safety checks, has all necessary maintenance completed, and can satisfy the specific rental request without conflicting reservations or operational holds.

All maintenance required before operation must be complete and verified. Service becoming due during rental must have an allowable, documented plan. Planned work alone does not satisfy a required safety check or necessary pre-operation maintenance requirement.

Equipment Ready remains the independent operational-readiness result. Rental Ready evaluates a specific request. Neither AI recommendations nor customer acceptance can override required safety checks, necessary maintenance, or operational holds.

## Rental blockers

| Condition | Effect |
|---|---|
| Failed or incomplete required safety checks | Block until checks pass and completion is verified |
| Necessary maintenance incomplete | Block until completion is verified |
| Unsafe condition or unresolved blocking defect or repair | Block until resolved and verified |
| Conflicting reservation, including preparation and return buffers | Not Available for the requested period |
| Active operational hold | Block until properly released |
| Required work causes a full outage during rental | Not Available for the requested period |
| Equipment cannot meet confirmed requested capabilities or location | Unsuitable for this request |
| Missing or contradictory evidence | Human Review Required; readiness cannot be confirmed |
| Customer declines permissible planned work or interruption | Reject this option and evaluate alternatives |

Mock customer information remains display-only. Explicitly gathered request requirements govern suitability; do not silently activate customer-record restrictions.

## Operational Failure

Operational Failure classifies issues arising during normal intended operation, including safety failures, maintenance-related failures, and mechanical defects. It excludes misuse and damage caused during delivery or pickup.

Cause classification is separate from rental eligibility: unsafe or defective equipment remains blocked regardless of cause. Do not infer cause from a defect alone.

## Service due during rental

Before rental, flag service projected to become due through calendar dates, operating hours, or relevant condition triggers. Evaluate the full requested period.

For each flagged service:
1. Identify criticality and whether operation must stop when service becomes due.
2. Establish the applicable delay gate and policy.
3. Check warranty requirements and task-specific restrictions.
4. Evaluate permitted service location, service timing, downtime, parts, and technician confirmation.
5. Return an evidenced rental outcome and explain conditions or blockers.

Safety-critical and operationally critical service does not permit operation beyond its mandatory service point. Complete it before rental or establish a confirmed service stop before that point; operation cannot resume until completion is verified. This does not permit a full-outage conflict that the scoped rental cannot accommodate.

Non-safety, noncritical service may be delayed only within an established allowance. Unknown classification, missing allowance, or uncertain warranty relevance requires human review; human review is not permission to waive a mandatory limit.

Customer acknowledgement is required for permitted planned work or interruption and cannot extend service limits.

## Simple system-group delay gates

Use system groups rather than extensive component-level policies. A specific task may impose a stricter restriction.

| System group | Default treatment |
|---|---|
| Safety and control systems | No delay for safety-related work |
| Engine and power generation | Noncritical delay only within policy and warranty limits |
| Hydraulics and drivetrain | Same; faults affecting safe or reliable operation block use |
| Electrical and batteries | Distinguish safety/operational faults from noncritical service |
| Accessories and cosmetic items | Delay may be allowed only if not required for safety or requested use |

Supported gate values:
- No Delay
- Delay Permitted Within Policy
- Human Review Required

The group selects the default; task criticality, warranty requirements, and task-specific restrictions can make it stricter. Group membership alone does not establish an allowance.

## Warranty gate

| Warranty circumstance | Treatment |
|---|---|
| Covered equipment; service required to preserve coverage | Stay within documented warranty service limits |
| Warranty relevance or limits unknown | Human review before permitting delay |
| Out of warranty | Non-safety, noncritical work may qualify for a company-policy delay |
| Safety-critical or operationally critical work | Warranty status does not relax operating restrictions |

Capture warranty status, coverage dates, applicable service requirements, and permitted tolerances through an authoritative equipment record or policy reference. Age alone does not prove warranty status.

Out-of-warranty status removes warranty-related exposure; it does not establish that a delay has no cost impact. Additional damage, failure, and rental downtime remain relevant.

## Maintenance-record requirements

Each maintenance record must carry or reference:
- System group.
- Service criticality.
- Delay gate.
- Applicable delay-policy reference.
- Warranty requirement or reference.
- Task-specific restrictions overriding the group default.

Retain existing due dates/hour thresholds, schedules, service location, downtime, parts confirmation, technician confirmation, status, and completion evidence. Policy references must resolve to applicable limits; missing values must not become invented tolerances.

Exact schema names, policy storage, and migration behavior are implementation decisions still to be reviewed.

## Outcomes

- Rental Ready: all current safety and maintenance prerequisites pass; no request conflict or required conditional plan.
- Rental Ready with Conditions: prerequisites pass and a permitted future service plan or approved noncritical delay is established and acknowledged.
- Not Available: a known period conflict or mandatory limit cannot be satisfied.
- Remediation Required: identified work or evidence must be completed before readiness can be established.
- Human Review Required: classification, policy, warranty, or evidence is missing or contradictory.

Final precedence for multiple simultaneous findings remains to be specified. Preserve all findings and evidence rather than hiding a known blocker.

## Open policy and data decisions

No numerical delay allowance has been approved. Do not infer manufacturer policies from the fictional dataset or service names.

- Define a small set of fictional, explicitly labeled noncritical group allowances, in days and/or operating hours; Manager approval requires a Qualified Mechanic assessment.
- Decide how concurrent time/hour limits apply.
- Confirm task-level classifications for periodic engine, hydraulic, aerial, generator, telehandler, and battery work.
- Resolve the existing 24-hour pre-rental completion buffer: conditional timing risk versus absolute gate.
- Specify date-only request times, timezone, overlap boundaries, and preparation/return buffer semantics.
- Establish projected usage timing so service happens before a mandatory hour limit, not merely before rental end.
- Reconcile illustrative dataset inconsistencies, including periodic-service labels versus due-hour thresholds and corrective-work references.
- Review the customer-restriction scenario against the display-only mock-customer boundary.
- Decide how verified completion, operational hold release, and delay approval are represented and traced.

The generator example begins at 480 hours, has service due at 500, and projects 40 rental hours. Its scheduled service date alone does not establish compliance; usage timing or an approved allowance is needed.

## Accepted responsibility map — Item 3

Accepted on 2026-10-08. These are requirements; runtime implementation remains pending.

| Workflow step | AI responsibility | Deterministic rules | Human responsibility |
|---|---|---|---|
| Understand request | Interpret need, dates, location, intended use; ask for missing details | Validate dates and identifiers; retrieve matching records | Confirm ambiguous matches and requirements |
| Check readiness | Explain safety, inspection, maintenance, and defect findings | Calculate readiness from verified records; enforce blockers | Inspect, certify completed work, resolve conflicting evidence |
| Assess service during rental | Explain upcoming service and options | Evaluate projected hours, deadlines, system-group gates, warranty limits, established allowances | Review uncertain classifications; authorize delays only within permitted policy |
| Check availability | Explain conflicts and alternatives | Evaluate reservations, holds, buffers, location, capabilities | Select equipment or revised dates |
| Accept conditions | Present permitted service plan and interruption | Require recorded acknowledgement before conditional handoff | Customer Service records customer acceptance |
| Resolve work and release holds | Summarize outstanding work and evidence | Recalculate readiness; prevent release while required controls fail | Authorized staff verify completion and confirm hold release |
| Produce handoff | Summarize selection, conditions, evidence | Generate read-only outcome and traceable record | Customer Service confirms selection for existing rental process |

AI interprets and explains. Deterministic rules calculate eligibility and enforce limits. Authorized staff certify work and make decisions within policy.

Each human decision must record actor, timestamp, Equipment ID, decision, reason, and supporting evidence. For service delays, the system first determines whether policy permits a delay; an authorized employee approves its use for the rental. Missing policy requires review and cannot become automatic approval.

## Approved staff authorities

Approved on 2026-10-09. Qualifications must match the task; a role label alone does not establish certification.

| Decision or action | Authority | Boundary |
|---|---|---|
| Confirm rental needs and select equipment | Customer Service | Select only options permitted by evaluated rules |
| Record acceptance of conditions | Customer Service | Acceptance cannot waive service limits or holds |
| Place an operational hold | Mechanic or Manager | Record reason and supporting evidence |
| Assess defects and classify service criticality | Qualified Mechanic | Follow established policy; escalate uncertain classifications |
| Complete maintenance or repair | Qualified Mechanic | Record work and completion evidence |
| Certify required safety checks | Appropriately qualified inspector or Mechanic | Qualifications must match the inspection |
| Approve noncritical service delay | Manager | Requires Mechanic assessment and compliance with policy and warranty limits |
| Release routine maintenance hold | Qualified Mechanic | Required work verified and readiness recalculation passes |
| Resolve contradictory records or exceptional holds | Manager, supported by Mechanic | Correct or reconcile evidence before release |

The Mechanic establishes technical eligibility; the Manager authorizes permitted service delays; Customer Service manages rental selection and acknowledgement. General Staff may view status and report concerns, but cannot certify work, approve delays, or release holds.

## Routine hold release

Agreed on 2026-10-08. Routine release removes a hold for a known inspection, maintenance, or repair task after its predefined completion requirements are satisfied.

A qualified Mechanic may release the hold only when:
- Work falls within their qualifications and authority.
- Required work is complete and evidence recorded.
- Required safety checks or reinspection have passed.
- No unresolved blocking defect or conflicting evidence remains.
- The deterministic readiness check passes.
- No separate hold remains requiring another authority.

Record Mechanic identity, timestamp, Equipment ID, hold reference, and completion evidence. Releasing one hold does not release another.

Manager review is required for exceptions, service-delay approval, uncertain evidence, or a hold reserved for Manager authority. Manager approval cannot waive required safety checks or mandatory service limits.

Example: completed scheduled maintenance with passed required checks permits routine release. A request to rent before necessary maintenance is complete does not.

## Availability forecast while the customer waits

Agreed on 2026-10-09. Customer Service needs a prompt answer before pending work and hold release are complete. Keep current readiness separate from a forecast for the requested start.

| Situation | Customer Service response |
|---|---|
| All checks pass and no conflicts exist | Rental Ready |
| Hold exists, but required work has a confirmed completion plan feasible for the requested start | Potentially available—pending work and release |
| Timing, parts, technician, or release requirements are uncertain | Availability cannot yet be confirmed |
| Work cannot finish in time | Not Available; offer alternatives |

Immediately show outstanding work, expected completion, confirmation status, and required release authority. Derive the first response from existing records; involve the Mechanic or Manager when confirmation is missing.

A confirmed plan supports a forecast only. It does not mark work complete, release a hold, certify safety, establish Ready to Rent, allocate equipment, or confirm a reservation. Known reservation conflicts and other blockers must remain visible and prevent an unsupported positive forecast.

The forecast is a separate presentation result, not an automatic replacement for Equipment Readiness or the existing availability outcome contract. Exact schema mapping remains an implementation decision.

## Approved review-routing rule

Approved on 2026-10-09.

| Situation | System action | Staff involvement |
|---|---|---|
| Records complete and all rules pass | Return Rental Ready with evidence | Customer Service selects equipment |
| Required work has a confirmed, feasible completion plan | Return potentially available, pending work and release | Mechanic verifies completion and releases the hold within approved authority |
| Work timing, parts, technician, or technical classification uncertain | Identify missing confirmation | Qualified Mechanic assesses and confirms |
| Noncritical delay permitted by established policy | Show permitted limit and rental impact | Mechanic assesses; Manager approves delay |
| Conflicting evidence or exceptional hold release | Keep readiness unconfirmed and show conflict | Manager resolves with Mechanic support |
| Known conflict or mandatory limit prevents rental | Return Not Available and evaluate alternatives | Customer Service chooses an alternative |

AI may explain and prepare the review request. Deterministic rules select the required reviewer and keep the blocker active until a recorded decision satisfies policy. Routing does not expand the approved staff authorities.

For the customer waiting on the phone, show what is known, what is pending, who must act, and any recorded expected completion time. Missing information remains explicit; AI must not invent an answer or completion estimate.

## Approved review completion and reevaluation

Approved on 2026-10-09.

| Review result | System response |
|---|---|
| Mechanic confirms feasible completion plan | Update availability forecast; keep hold active |
| Work complete and routine release requirements pass | Record authorized release, then recalculate readiness and availability |
| Manager approves permitted delay | Record approval, limits, conditions; recalculate rental eligibility |
| Request denied or work cannot finish in time | Mark option unavailable and present alternatives |
| Review incomplete | Keep availability unconfirmed and identify outstanding action |

A recorded decision triggers reevaluation; it does not directly overwrite Ready to Rent. Changes to rental dates, projected operating hours, service plans, or relevant equipment evidence require reevaluation of whether earlier decisions still apply.

The loop is request → review → decision → reevaluation → customer response.

## Reservation planning follow-up

Recorded on 2026-10-09. Return to reservations as an explicit follow-up: the desired capability is to reserve equipment and understand availability on a future timeline, including requests days, weeks, or months before pickup.

In-time reservations are requests made up to five days before pickup. This is a lead-time classification, not an availability horizon or a replacement for the existing three-day pre-rental work-review window or 24-hour completion buffer.

Future availability must account for the requested rental period and relevant commitments, service projections, buffers, and holds rather than evaluating only immediate availability. Future forecasts must remain separate from current verified readiness.

Reservation creation is a requested future capability. This PR's current implementation increment remains read-only; reservation writes require a separately defined and reviewed scope before implementation. Do not silently apply the existing 30-day alternative-date search horizon as a maximum advance-booking horizon.

Follow-up questions include reservation lifecycle and statuses, allocation/commitment rules, advance-booking horizon, future usage and service projections, and revalidation as pickup approaches. These are pending requirements, not approved detailed policies.

## PR 17 working agreement

PR #17 is the working decision record and implementation PR for this increment. Record accepted decisions here, implement sufficiently defined requirements on its branch, and retain unresolved policy values explicitly.

Track implementation tasks as Pending, Implemented, or Verified, with evidence for verified status. Update the PR description and validation evidence as scope evolves. Current runtime implementation status: Pending.

Keep the PR open for review until the user explicitly authorizes merging. This agreement authorizes continued work on the PR; it does not authorize merging.

## Implementation checklist

- [ ] Reconcile existing readiness/availability documents with these requirements.
- [ ] Define and review the minimal policy schema and maintenance-record additions.
- [ ] Update the editable source, reviewed JSON snapshot, types, and validator through the established data workflow.
- [ ] Classify seeded tasks and add explicit fictional warranty and policy evidence.
- [ ] Implement the read-only availability evaluator consuming Equipment Readiness.
- [ ] Evaluate reservation/hold conflicts and requested-period buffers.
- [ ] Evaluate due service, projected hours, stop-operation rules, delay gates, and warranty limits.
- [ ] Return structured outcomes, reason codes, evidence, conditions, and required actions.
- [ ] Test normal readiness, failed safety, incomplete maintenance, reservations, holds, full outages, missing policy/warranty, allowed delay, exceeded delay, and mandatory service stops.
- [ ] Prove misuse/delivery/pickup exclusions do not bypass readiness controls.
- [ ] Connect Customer Service to the evidenced decision and conditional acknowledgement.
- [ ] Implement staff-authority and qualification checks for human decisions.
- [ ] Implement deterministic review routing and evidence-backed Customer Service responses.
- [ ] Implement review-completion reevaluation and reassess prior decisions when relevant inputs change.
- [ ] Test confirmed plans retaining holds, authorized release, permitted delay decisions, denial, incomplete review, and changed inputs.
- [ ] Test correct reviewer routing, active blockers during review, and missing completion estimates.
- [ ] Implement the separate Customer Service availability forecast without bypassing current readiness or holds.
- [ ] Test unauthorized release, multiple holds, uncertain completion, feasible forecasts, and work that cannot finish in time.
- [ ] Complete the scoped Mechanic resolution/human-release path and recorded outcome.
- [ ] Run lint, typecheck, tests, build, and relevant interface verification.
- [ ] Capture a short end-to-end demonstration and update the checkpoint.

## Follow-up checklist

- [ ] Work through reservation requirements for days, weeks, and months in advance, including reservation creation scope and the up-to-five-day in-time classification.

## Scope and checklist status

Item 1 (repository baseline review) is complete; tests were not rerun during that review.
Item 2 (complete equipment-readiness workflow demonstration) remains in progress.
Item 3 responsibility map, staff authorities, routine hold release, and availability-forecast requirements are accepted and recorded; implementation and demonstration remain pending.

This change documents requirements only. It does not change runtime code, data, readiness outcomes, or service schedules. Reservations remain read-only. CRM, rental execution, transfers, procurement, and broad scheduling remain outside scope.

## Related references

- [Equipment Readiness and Rental Availability Boundary](../decisions/005-equipment-readiness-boundary.md)
- [Customer Service Inventory Search Workflow](../architecture/customer-service-inventory-search-workflow.md)
- [Equipment Readiness Data Model](equipment-readiness-data-model.md)
- [AI, Human, and Deterministic-Control Boundary](../architecture/ai-human-deterministic-control-boundary.md)
- [Post-PR 13 Checkpoint](../checkpoints/2026-08-14-post-pr-13.md)
