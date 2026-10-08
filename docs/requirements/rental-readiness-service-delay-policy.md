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

- Define a small set of fictional, explicitly labeled noncritical group allowances, in days and/or operating hours, and their approval authority.
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

Specific staff-role authorities for delay approval, certification, exception resolution, and hold release remain unresolved. No authority assignment is implied by this map.

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
- [ ] Complete the scoped Mechanic resolution/human-release path and recorded outcome.
- [ ] Run lint, typecheck, tests, build, and relevant interface verification.
- [ ] Capture a short end-to-end demonstration and update the checkpoint.

## Scope and checklist status

Item 1 (repository baseline review) is complete; tests were not rerun during that review.
Item 2 (complete equipment-readiness workflow demonstration) remains in progress.
Item 3 responsibility map is accepted and recorded; staff-role authorities and implementation remain pending.

This change documents requirements only. It does not change runtime code, data, readiness outcomes, or service schedules. Reservations remain read-only. CRM, rental execution, transfers, procurement, and broad scheduling remain outside scope.

## Related references

- [Equipment Readiness and Rental Availability Boundary](../decisions/005-equipment-readiness-boundary.md)
- [Customer Service Inventory Search Workflow](../architecture/customer-service-inventory-search-workflow.md)
- [Equipment Readiness Data Model](equipment-readiness-data-model.md)
- [AI, Human, and Deterministic-Control Boundary](../architecture/ai-human-deterministic-control-boundary.md)
- [Post-PR 13 Checkpoint](../checkpoints/2026-08-14-post-pr-13.md)
