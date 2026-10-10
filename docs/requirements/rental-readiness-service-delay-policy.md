# Rental Readiness and Service Delay Requirements

- Date: 2026-10-08
- Status: Agreed requirements captured for PR review; implementation pending
- Applies to: Northstar Ridge Equipment Group, Rental Availability and simulated Customer Service workflow
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

Customer identity, required billing verification, and required insurance verification are explicit Customer Service checks using sample records. Equipment eligibility remains separate from customer eligibility. Do not infer additional restrictions from mock records.

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

Customer acknowledgement is required before final handoff for work, interruptions, swaps, or restrictions that affect the customer. An approved internal service delay with no customer impact does not require customer disclosure or acknowledgement. Acceptance cannot extend service limits.


Service delay means postponing service beyond its due date or operating-hour threshold; it does not mean the time needed to schedule and complete work. The gate "No operation beyond service limit" prohibits continued operation beyond the mandatory point until required work is completed and verified. Work may be scheduled for later while equipment remains stopped or on hold. A rental can proceed after required pre-rental work/checks/release finish before preparation begins, or under a confirmed service stop or replacement plan before the mandatory limit. Scheduling does not release a hold or establish readiness.

## Simple system-group delay gates

Use system groups rather than extensive component-level policies. A specific task may impose a stricter restriction.

| System group | Default treatment |
|---|---|
| Safety and control systems | No operation beyond the mandatory service limit for safety-related work |
| Engine and power generation | Noncritical delay only within policy and warranty limits |
| Hydraulics and drivetrain | Same; faults affecting safe or reliable operation block use |
| Electrical and batteries | Distinguish safety/operational faults from noncritical service |
| Accessories and cosmetic items | Delay may be allowed only if not required for safety or requested use |

Supported gate values:
- No operation beyond service limit
- Delay Permitted Within Policy
- Human Review Required

The group selects the default; task criticality, warranty requirements, and task-specific restrictions can make it stricter. Group membership alone does not establish an allowance.

## Approved policy references, timing, and usage — 2026-10-10

### Named service-delay policies

Stable policy identities allow the demo references to become fuller policies later.

| Policy ID | Policy name |
|---|---|
| NRE-MNT-001 | Safety and Control Service Delay Policy |
| NRE-MNT-002 | Engine and Power Service Delay Policy |
| NRE-MNT-003 | Hydraulics and Drivetrain Service Delay Policy |
| NRE-MNT-004 | Electrical and Battery Service Delay Policy |
| NRE-MNT-005 | Accessories and Cosmetic Service Delay Policy |

Maintenance records must reference the applicable policy ID and version. Each group policy specifies maximum delay in days, operating hours, or both. When both apply, service must occur before either limit is exceeded. Task-specific and warranty requirements can impose stricter limits. Missing limits require review, never implied permission. A qualified Mechanic assesses work; a Manager approves use of a permitted delay within policy.

Demo allowances must be explicitly labeled fictional. Numerical service-delay values remain unapproved; policy names do not establish allowances. Fuller policies can be developed later without changing the workflow.

### Rental timing and protected buffers

| Area | Approved demo rule |
|---|---|
| Rental times | Require pickup and return date/time in the branch's local timezone; obtain missing times before confirmation. |
| Preparation | Default two hours before pickup for inspection, preparation, and loading. |
| Return turnaround | Default two hours after return for unloading, inspection, and routine preparation. |
| Additional work or transport | Use recorded duration when it requires more time than the default buffer. |
| Protected interval | Protect from preparation start through turnaround completion; another booking may start preparation exactly when the prior interval ends. |
| Pre-rental required work | Required maintenance, safety checks, and authorized hold release must finish before preparation begins. |
| Previous 24-hour completion buffer | Replace the blanket requirement with the preparation rule above. Confirmed completion plans support forecasts only until verified completion/release. |
| Temporary allocation | Four hours from creation measures draft protection lifespan, separate from rental dates and operational buffers. |

Defaults are fictional and configurable. Early completion alone does not shorten protected time; a recorded update and reevaluation are required. A Monday 9 AM pickup and Friday 3 PM return protects Monday 7 AM through Friday 5 PM unless recorded work or transport requires longer.

### Projected operating hours

Capture expected operating hours per day when service depends on usage. Calculate when the equipment would reach its service threshold and schedule required service or replacement before that threshold. A daily estimate must not become an invented precise clock time: request a more specific usage plan when needed to establish safe timing. Reevaluate when dates or expected usage change.

Example: a meter at 480 hours, mandatory service at 500 hours, and expected use of eight hours per day reaches the threshold during day three (after four operating hours that day). Required service or replacement must occur before further operation would exceed 500 hours. Calendar scheduling alone does not prove compliance.


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
- Applicable delay-policy ID and version.
- Warranty requirement or reference.
- Task-specific restrictions overriding the group default.

Retain existing due dates/hour thresholds, schedules, service location, downtime, parts confirmation, technician confirmation, status, and completion evidence. Policy references must resolve to applicable limits; missing values must not become invented tolerances.

Exact schema names, policy storage, and migration behavior are implementation decisions still to be reviewed.

## Outcomes

- Rental Ready: all current safety and maintenance prerequisites pass; no request conflict or customer-facing conditional plan. An approved internal service delay that satisfies all applicable limits and has no customer impact follows this outcome.
- Rental Ready with Conditions: prerequisites pass and a permitted future service or replacement plan with customer impact is established. It may be presented before acknowledgement; recorded customer acceptance gates final handoff.
- Not Available: a known period conflict or mandatory limit cannot be satisfied.
- Remediation Required: identified work or evidence must be completed before readiness can be established.
- Human Review Required: classification, policy, warranty, or evidence is missing or contradictory.

Final precedence for multiple simultaneous findings remains to be specified. Preserve all findings and evidence rather than hiding a known blocker.

## Open policy and data decisions

No numerical delay allowance has been approved. Do not infer manufacturer policies from the fictional dataset or service names.

- Define a small set of fictional, explicitly labeled noncritical group allowances, in days and/or operating hours; Manager approval requires a Qualified Mechanic assessment.
- Confirm task-level classifications for periodic engine, hydraulic, aerial, generator, telehandler, and battery work.
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
| Check availability | Explain conflicts and alternatives | Evaluate reservations, holds, buffers, location, capabilities | Approve the proposed equipment or choose revised dates |
| Accept conditions | Present permitted service plan and interruption | Require recorded acknowledgement before conditional handoff | Customer Service records customer acceptance |
| Resolve work and release holds | Summarize outstanding work and evidence | Recalculate readiness; prevent release while required controls fail | Authorized staff verify completion and confirm hold release |
| Produce handoff | Summarize selection, conditions, evidence | Generate read-only outcome and traceable record | Customer Service confirms selection for existing rental process |

AI interprets and explains. Deterministic rules calculate eligibility and enforce limits. Authorized staff certify work and make decisions within policy.

Each human decision must record actor, timestamp, Equipment ID, decision, reason, and supporting evidence. For service delays, the system first determines whether policy permits a delay; an authorized employee approves its use for the rental. Missing policy requires review and cannot become automatic approval.

## Approved staff authorities

Approved on 2026-10-09. Qualifications must match the task; a role label alone does not establish certification.

| Decision or action | Authority | Boundary |
|---|---|---|
| Confirm rental needs and approve proposed equipment | Customer Service | System proposes the best eligible option; approval stays within evaluated rules |
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
| Records complete and all rules pass | Return Rental Ready with evidence | Customer Service approves the automatically proposed equipment |
| Required work has a confirmed, feasible completion plan | Return potentially available, pending work and release | Mechanic verifies completion and releases the hold within approved authority |
| Work timing, parts, technician, or technical classification uncertain | Identify missing confirmation | Qualified Mechanic assesses and confirms |
| Noncritical delay permitted by established policy | Show permitted limit and rental impact | Mechanic assesses; Manager approves delay |
| Conflicting evidence or exceptional hold release | Keep readiness unconfirmed and show conflict | Manager resolves with Mechanic support |
| Known conflict or mandatory limit prevents rental | Return Not Available and evaluate alternatives | System proposes an eligible alternative; Customer Service approves |

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

In-time reservations are requests made up to five days before pickup. This is a lead-time classification, not an availability horizon or a replacement for the existing three-day pre-rental work-review window ; the former blanket 24-hour completion buffer is superseded by the approved preparation rule.

Future availability must account for the requested rental period and relevant commitments, service projections, buffers, and holds rather than evaluating only immediate availability. Future forecasts must remain separate from current verified readiness.

Reservation creation is a requested future capability. This PR's current implementation increment remains read-only; reservation writes require a separately defined and reviewed scope before implementation. Do not silently apply the existing 30-day alternative-date search horizon as a maximum advance-booking horizon.

Follow-up questions include reservation lifecycle and statuses, allocation/commitment rules, advance-booking horizon, future usage and service projections, and revalidation as pickup approaches. These are pending requirements, not approved detailed policies.

## Approved decision presentation

Approved on 2026-10-09. Each equipment result must show:

| Element | Staff-facing content |
|---|---|
| Current readiness | Verified equipment status and active holds |
| Requested-period availability | Rental outcome or future forecast, with conditions |
| Rule findings | Safety, maintenance, warranty, and reservation evidence |
| AI explanation | Plain-language summary grounded in the rule findings |
| Required human action | Required actor, decision/action, and review status |
| Decision history | Recorded approvals, completed work, releases, and reevaluation |

Current readiness and future availability must always appear separately. Potentially available by pickup must not be presented as ready now. Unknown or missing evidence must remain explicit. AI explanation cannot replace the authoritative rule result.

Eight requirements walkthroughs were accepted on 2026-10-09, as recorded below. These are discussion-based validation, not executed software tests. Runtime implementation and demonstration remain pending.

## Approved automatic equipment selection and final human gate

Approved on 2026-10-09 after the normal/exception walkthrough.

Equipment selection is not a mandatory human step:
1. Deterministic rules identify eligible equipment and rank it using the agreed criteria.
2. The system automatically selects the best eligible option.
3. AI presents the equipment, availability, evidence, conditions, and proposed rental summary.
4. Human approval and customer acceptance occur before rental confirmation.

Automatic selection starts as a proposal. The approved Customer Service simulation below adds temporary allocation after qualifying selection, before final acceptance; it does not authorize production reservation writes. Ambiguous requirements still require clarification. An option pending maintenance or hold release may be presented provisionally but cannot be represented as Ready to Rent.

For the demo, the final gate is simulated staff approval and customer acceptance with allocation state transitions. Actual production reservation confirmation remains part of the reservation follow-up.

This supersedes earlier requirements in this increment that made Customer Service manually select equipment. Existing workflow documentation must be reconciled during implementation. Human approval, certification, permitted-delay authorization, and hold-release gates remain in force.

## Accepted requirements walkthroughs — 2026-10-09

All eight walkthroughs were reviewed individually and accepted by the user. These decisions refine earlier wording where it conflicts; they do not constitute executed software tests or runtime implementation.

| Test | Scenario | Accepted behavior |
|---|---|---|
| 1 | Ready unit versus a unit awaiting maintenance | Automatically propose the qualifying ready unit ahead of a pending-work option. Present through staff approval and customer acceptance. |
| 2 | No ready unit; confirmed maintenance completion before pickup | Present potentially available, pending completion and authorized release. Include the recorded projected completion date/time; do not invent an estimate. Reevaluate after completion and release. |
| 3 | No ready or confirmed conditional unit; uncertain hold resolution | No qualifying availability for the requested type and dates. Exclude unresolved holds from rental selection. Offer a callback after Mechanic or Manager review under approved authority, or customer-agreed changes to dates/location/requirements. Promise an update, not availability. Keep holds active until properly released, then reevaluate. |
| 4 | Service due during rental; approved delay meets all rules | Treat as Test 1, Rental Ready, when all policy/warranty limits pass and there is no customer impact. Service detail remains available to Customer Service; no customer disclosure is needed solely for the internal delay. Disclose any restriction or interruption affecting the customer. |
| 5 | Operation cannot continue beyond mandatory service limit | A confirmed plan must satisfy the mandatory limit. Pre-pickup work follows Test 2 then Test 1; service during rental requires disclosure and customer acceptance of interruption. No confirmed plan follows Test 3. No operation past the mandatory limit until service is verified complete. |
| 6 | Warranty prevents an otherwise permitted delay | Warranty requirements take precedence over general company delay allowances. Manager cannot waive them. Use the established pre-pickup, service-during-rental, or unavailable/callback paths. |
| 7 | Incomplete or conflicting repair/safety/release records | Exclude the unit until evidence and authorized release support readiness. Repair completion alone does not prove required reinspection passed. Known missing inspection requires completing/recording it; contradictory evidence or exception holds require Manager review with Mechanic support. Reevaluate after resolution; use Test 3 callback when no other qualifying option exists. |
| 8 | Dates or projected usage change | Automatically reevaluate the full revised request, conflicts, buffers, service limits, and applicability of prior approvals. A confirmed replacement swap can support the rental when it satisfies the requirements below. |

### Brief AI responses and staff detail

Default AI responses must be brief and action-focused so Customer Service can answer quickly. Keep supporting rule evidence and service detail accessible in the staff presentation.

- Ready: "This unit is available for your requested dates."
- Pending pre-pickup work: "Maintenance is expected to finish [recorded date/time], before pickup. Availability remains pending completion and mechanic release."
- No qualifying unit: "No unit is currently available. We can check whether the hold can be resolved and call you back, or check different dates or another location."
- Approved internal delay, staff detail: "Ready for the requested dates. Service delay approved; service scheduled after return."
- Required interruption: "This unit can cover your dates with a required [recorded duration] service stop on [recorded date/time]. Confirm customer acceptance."

Examples are presentation requirements, not generated estimates. Any quoted timing or duration must come from confirmed records.

### Confirmed replacement swap

Delivering a replacement and collecting the original unit can satisfy a service requirement and allow the rental to proceed when:
- Both units qualify for their respective portions of the requested rental, including safety, maintenance, capabilities, reservations, holds, service limits, and buffers.
- The replacement is available for the remaining period.
- Delivery, pickup, and handoff are confirmed before the original unit's mandatory service limit.
- Any interruption or customer-facing condition is disclosed and accepted.
- The plan, evidence, and required approvals are recorded; reevaluation supports the resulting rental proposal.

The original unit cannot operate beyond its mandatory service point. AI may present the confirmed swap plan through approval and acceptance; it cannot invent transport availability or release equipment controls.

Working cost assumption, clarified by the user: no additional pickup or delivery charge is applied for the replacement swap in the demo. The agreed rental charge still applies. This is provisional, not a settled transport cost policy. Example only after plan confirmation: "A replacement swap can cover the rental, with no additional pickup or delivery charge."

The swap is an accepted planning requirement. The current read-only increment may evaluate/present it; actual dispatch, pickup, delivery, reservation writes, and rental execution require separately defined implementation scope.


## Approved Customer Service workflow — 2026-10-09

All eight Customer Service walkthroughs were reviewed individually and accepted. These are illustrative requirements walkthroughs, not executed software tests. This section supersedes earlier read-only wording only for the approved demo simulation; production CRM, booking, dispatch, and rental execution remain outside scope.

### Intake and customer checks

Capture equipment type/capabilities, requested pickup/return dates and times, branch/site, intended use, and projected operating hours when relevant. Capture renter name, company name for company rentals, customer identity, billing information/contact/address, delivery address, primary contact and phone/email, pickup/return contact and responsibilities, and insurance verification for on-site use and pickup/return transport.

Every request must check customer identity:
- Existing customer: confirm the match and rental-specific details, then proceed.
- New customer: apply the existing new-customer rules and workflow; building registration is outside this demo.
- Uncertain match: resolve it before proceeding; do not create a duplicate automatically.

Enter shared intake once and reuse it for both the customer profile process and rental agreement. The profile can be completed in parallel while a qualifying equipment allocation protects the requested period. Required customer, billing, and insurance checks must pass before final acceptance. Use sample verification states in the demo; substantive billing/insurance policies are not newly defined here.

Capture delivery/pickup notes and special instructions, including access, gates, arrival contact, timing windows, and loading/unloading requirements. Carry them into the agreement and handoff; reassess availability/logistics if they affect feasibility or timing.

### Proposal and final gate

Present customer/company and setup status; rental, billing, and pickup contacts; automatically proposed equipment and capabilities; dates/use/hours; logistics and notes; readiness and requested-period availability; billing/insurance verification status; customer-facing service, downtime, restrictions, or replacement conditions; and the next required action.

AI prepares and presents through approval and acceptance. Customer Service reviews and approves the proposal and records customer acceptance. Recheck current eligibility at final acceptance. Pending mandatory checks block confirmation. Customer acceptance cannot waive safety, maintenance, warranty, or operational holds.

### Temporary allocation lifecycle

- Create a simulated temporary allocation after qualifying selection, protecting the requested equipment period from competing bookings while customer setup/agreement preparation proceeds.
- Lifespan is four hours from creation. Temporary allocation does not certify safety or bypass any eligibility rule.
- Agreement accepted before expiry, after all gates pass: convert to confirmed allocation without releasing the assignment.
- Agreement canceled before acceptance: cancel the draft and release the temporary allocation; retain customer details and decision history.
- Four hours elapsed without acceptance: expire and release competition protection; preserve customer/profile data, draft agreement, and special instructions.
- After expiry, reevaluate availability and readiness and obtain a new temporary allocation with a new four-hour lifespan before acceptance.
- Reevaluate on relevant equipment, request, or plan changes. New blockers prevent acceptance even while temporarily allocated.
- Replacement plans protect both units for their respective rental segments. Moving to an approved replacement releases the original assignment and protects the replacement; confirmation preserves the qualifying assignments.
- An allocation confirmed before expiry is not released by the temporary expiry timer.
- Cancellation after confirmation follows a separate rental cancellation process still to be defined.

Use recorded creation/expiry times in staff responses. Do not imply that temporary allocation guarantees readiness.

### Callback workflow

When no qualifying ready or confirmed conditional option exists, offer a callback after authorized Mechanic or Manager review. Record customer contact, agreed callback time, request/equipment, pending question, deterministic reviewer, Customer Service owner, and review result. Preserve holds until authorized release and reevaluate after resolution.

Keep the callback open until Customer Service records the customer update. If review is unfinished at the agreed time, provide a status update without promising equipment. If equipment subsequently qualifies, create the four-hour temporary allocation while completing the customer interaction. Use sample records; automated calls and notifications are outside this demo.

### Accepted Customer Service walkthroughs

| Test | Scenario | Accepted behavior |
|---|---|---|
| 1 | Existing customer, ready equipment | Confirm customer and rental-specific details, required billing/insurance checks and logistics; automatically propose equipment; staff approves and customer accepts; hand off to existing rental process. |
| 2 | New customer setup in parallel | Reuse intake for profile and agreement; apply existing new-customer rules; protect qualifying equipment through a four-hour temporary allocation; required checks still gate acceptance. |
| 3 | No qualifying unit; callback | Route unresolved hold review to approved authority; record callback ownership/time; keep holds active. After verified work/release, reevaluate, temporarily allocate qualifying equipment, and complete remaining gates. |
| 4 | Temporary allocation expires | Release protection at four hours; keep customer details, draft and notes. Recheck and create a new allocation before acceptance; offer alternatives/callback if no longer qualifying. |
| 5 | Safety issue during allocation | Place safety hold and block acceptance; retain draft; evaluate qualifying alternatives. Moving assignment protects replacement and releases original allocation, not its safety hold. Otherwise offer callback; repair forecast does not establish readiness. |
| 6 | Required billing or insurance verification pending | Preparation continues but acceptance/confirmed conversion is blocked. Verification passing within allocation window allows final review/acceptance; after expiry recheck availability. Failed verification requires resolution. |
| 7 | Customer-facing service/replacement conditions | Present confirmed swap timing, recorded downtime and instructions; record customer acceptance and protect both rental segments. If declined, evaluate a full-period alternative, revised dates or callback. Material plan changes require reevaluation and renewed acceptance. No additional swap pickup/delivery charge in demo; agreed rental charge applies. |
| 8 | Accept, cancel, or accept after expiry | Recheck eligibility and record staff approval/customer acceptance before confirmed conversion preserving assignment. Pre-acceptance cancellation releases temporary allocation. Expired allocation requires recheck/new allocation. Post-confirmation cancellation remains follow-up. |

Brief staff responses should show the actionable result, outstanding check, and recorded expiry or completion timing. Supporting evidence remains accessible. Internal approved delays without customer impact remain staff detail; customer-facing downtime/restrictions/swaps must be disclosed.

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
- [ ] Evaluate reservation/hold conflicts using approved two-hour preparation/return defaults, recorded longer durations, branch timezone, and adjacent protected intervals.
- [ ] Evaluate due service, daily projected hours and specific usage timing where required, stop-operation rules, versioned policy references, delay gates, and warranty limits.
- [ ] Return structured outcomes, reason codes, evidence, conditions, and required actions.
- [ ] Test normal readiness, failed safety, incomplete maintenance, reservations, holds, full outages, missing policy/warranty, allowed delay, exceeded delay, and mandatory service stops.
- [ ] Prove misuse/delivery/pickup exclusions do not bypass readiness controls.
- [x] Validate requirements and presentation through eight accepted discussion walkthroughs (2026-10-09); software tests remain pending.
- [ ] Implement brief AI responses with accessible staff evidence and recorded projected completion times.
- [ ] Implement no-availability callback/review handling without implying rental eligibility or releasing holds.
- [ ] Evaluate confirmed replacement plans across both units and transport timing within the read-only scope.
- [ ] Verify the eight accepted paths with executable tests after implementation.
- [ ] Implement the six presentation elements with separate current readiness and requested-period availability.
- [ ] Implement automatic proposal selection from deterministic eligibility/ranking and AI presentation through the final approval/acceptance gate.
- [ ] Test automatic proposals, provisional options, ambiguous requirements, temporary allocation after qualifying selection, and prevention of confirmation before all approval/acceptance gates.
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

- [x] Validate Customer Service requirements through eight accepted discussion walkthroughs (2026-10-09); executable tests remain pending.
- [ ] Implement sample existing/new customer routing, shared intake, verification gates, and proposal summary without building registration.
- [ ] Implement delivery/pickup notes and feasibility reassessment.
- [ ] Implement simulated four-hour temporary allocation, confirmed conversion, pre-acceptance cancellation, expiry, and reacquisition after recheck.
- [ ] Implement callback sample records, ownership, agreed update time, review result and closure.
- [ ] Test Customer Service walkthroughs, changed readiness during allocation, customer-impact acceptance and both-unit replacement protection.
- [ ] Reconcile superseded read-only/allocation boundaries across existing architecture documents.

## Follow-up checklist

- [ ] Revisit internal service-delay detail versus customer disclosure after the Customer Service workflow is complete.
- [ ] Review replacement-swap transport costs; no additional pickup or delivery charge is the demo assumption, while the agreed rental charge applies.
- [ ] Define detailed replacement logistics, approvals, and execution scope before adding dispatch or rental writes.

- [ ] Work through reservation requirements for days, weeks, and months in advance, including reservation creation scope and the up-to-five-day in-time classification.

- [ ] Define cancellation after confirmed acceptance.

## Scope and checklist status

Item 1 (repository baseline review) is complete; tests were not rerun during that review.
Item 2 (complete equipment-readiness workflow demonstration) remains in progress.
Item 3 responsibility map, staff authorities, review routing, hold release, forecast, presentation, and Customer Service workflow requirements are accepted. Eight readiness and eight Customer Service discussion walkthroughs are complete; implementation and demonstration remain pending.
Items 4 (portfolio evidence) and 5 (validation/checkpoint) remain pending.

This change documents requirements only. It does not change runtime code, data, readiness outcomes, or service schedules. Production reservations remain read-only; simulated temporary/confirmed allocation states are now approved demo scope. Building CRM/new-customer registration, production rental execution, transfers, procurement, and broad scheduling remain outside scope.

## Related references

- [Equipment Readiness and Rental Availability Boundary](../decisions/005-equipment-readiness-boundary.md)
- [Customer Service Inventory Search Workflow](../architecture/customer-service-inventory-search-workflow.md)
- [Equipment Readiness Data Model](equipment-readiness-data-model.md)
- [AI, Human, and Deterministic-Control Boundary](../architecture/ai-human-deterministic-control-boundary.md)
- [Post-PR 13 Checkpoint](../checkpoints/2026-08-14-post-pr-13.md)
