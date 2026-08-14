# Mechanic Equipment Work Workflow

- **Status:** Accepted working workflow
- **Role:** Mechanics
- **Primary identifier:** Equipment ID
- **Primary outcome:** Equipment returned to Ready to Rent or retained on Mechanic Hold

## Objective

Help a mechanic identify existing equipment, understand the work preventing or
affecting readiness, place the asset under operational control, complete authorized
work, and cause readiness to be recalculated from evidence.

## Accepted Decisions

### Shared Intelligent Entry

The mechanic starts with the same intelligent input pattern used by customer service.
It accepts Equipment ID, serial number, natural-language equipment requests, and
natural-language work requests.

The system normalizes identifiers, uses the mechanic's current location by default,
requires confirmation for uncertain matches, preserves the Equipment ID, and presents
mechanic-focused results.

Examples include:

- `EQ1001`
- `NSR-KX040-001`
- “Show me this grader.”
- “Show equipment needing inspection.”
- “Show equipment with overdue maintenance.”
- “Show open repairs at this location.”

### Required-Work-First Summary

After a specific asset is found, show:

- Equipment ID and serial number
- Equipment type, manufacturer, and model
- Current location and condition
- Equipment Readiness Outcome and explanation
- Required inspections
- Outstanding or upcoming maintenance
- Open defects and corrective work
- Scheduled work

Current required work is primary. Complete history remains available through a
separate view or link.

### Readiness-Impact Priority

Order work by:

1. Blocking safety defects
2. Failed inspections
3. Overdue maintenance
4. Required inspections
5. Open corrective work
6. Scheduled maintenance
7. Upcoming nonblocking work

Use due date and scheduled time within each level.

Rental-aware mechanic scheduling is a future extension. The current workflow does not
prioritize shop work using upcoming rentals, return dates, preparation windows, or
maintenance windows between rentals.

### One Focused Work Item

The mechanic opens one inspection, maintenance item, or repair at a time. Other
requirements remain visible in the equipment summary. This preserves a distinct audit
trail for each activity.

### Immediate Mechanic Hold

An authorized mechanic may move equipment from Ready to Rent to **Mechanic Hold** and
must select one reason:

- Repair
- Maintenance
- Inspection

The system records the Equipment ID, prior status, new status, hold reason, mechanic,
date and time, linked or new work item, and an optional note.

Mechanic Hold takes effect immediately when the reason is selected, before work begins.
The asset is removed from available inventory and its calculated readiness is
re-evaluated. Manager approval is not required to apply the hold.

Mechanic Hold is an operational control. Equipment Readiness remains a calculated
outcome, and rental availability remains a separate time- and context-specific result.

### Prepopulated Work Item

When the mechanic opens an inspection, maintenance activity, or repair, known
requirements are prepopulated from structured data. The mechanic enters or confirms:

- Findings
- Work performed
- Work status
- Equipment condition
- Defects
- Corrective action
- Evidence
- Notes

AI may summarize the record and identify missing information. It does not generate or
certify completion evidence.

### Display-Only Parts And Materials

The work screen includes a mock, read-only Parts and Materials section showing:

- Part or material
- Part number
- Required quantity
- Available quantity
- Availability status
- Stock location
- Parts-request or work-order reference
- Expected availability date, when unavailable

Example statuses include Available, Confirmed for Work, Partially Available, Not
Available, Awaiting Delivery, and Unknown.

This demonstrates dependency on an existing parts-management process. The demo does not
implement parts identification, ordering, receiving, staging, inventory adjustment, or
procurement.

When a required item is unavailable, deterministic data identifies the conflict and AI
summarizes its impact. The system asks:

> A required part or material is unavailable. Would you like to reschedule the
> inspection or maintenance?

The mechanic's yes/no decision is recorded as a human gate. A yes response produces a
handoff message to the existing scheduling process. The demo does not calculate
alternative dates, modify a schedule, manage technician capacity, or track the
rescheduling request. Mechanic Hold remains in effect while blocking work is incomplete.

### Minimum Completion Evidence

Before work can be marked complete, the mechanic must provide:

- Work performed
- Completion date and time
- Final result
- Remaining defects or issues
- Final equipment condition
- Evidence reference or attachment
- Mechanic identity

AI may summarize the information and call out missing fields. The mechanic reviews and
confirms the record. Deterministic rules decide whether the evidence satisfies the
inspection, maintenance, or repair requirement.

### Human-Confirmed Hold Release

After blocking work appears complete:

1. Deterministic rules recalculate Equipment Readiness.
2. The system identifies any remaining blocker or contradictory evidence.
3. If release is permitted, the mechanic is asked to confirm release of Mechanic Hold.
4. The mechanic makes the final recorded release decision.
5. The operational status changes to **Ready to Rent**.

The status section prominently displays:

- Equipment ID
- Mechanic Hold status
- Equipment Readiness Outcome
- Ready-to-Rent status
- Remaining blockers
- Last status change
- Confirming mechanic
- Confirmation date and time

The system prevents release when any blocking inspection, maintenance, defect, missing
evidence, or contradictory record remains.

## Normal Flow

1. Enter an Equipment ID, serial number, equipment request, or work request.
2. Confirm the equipment record.
3. Review the required-work-first summary.
4. Select one inspection, maintenance activity, or repair.
5. Apply Mechanic Hold with a required reason.
6. Review prepopulated requirements and mock parts availability.
7. Perform work and record the minimum completion evidence.
8. Confirm the completed work record.
9. Recalculate Equipment Readiness through deterministic rules.
10. Confirm release of Mechanic Hold when permitted.
11. Display Ready to Rent in the equipment status section.

## Terminal Outcomes

- Ready to Rent
- Mechanic Hold retained because work is incomplete
- Mechanic Hold retained because parts or materials are unavailable
- Mechanic Hold retained because required evidence is missing
- Mechanic Hold retained because another blocker remains
- Human Review Required because evidence conflicts
- Rescheduling decision handed off to the existing scheduling process

## Explicit Exclusions

- New equipment intake
- Rental-aware shop prioritization
- Full work-order management
- Labor and cost tracking
- Parts ordering, receiving, procurement, or inventory adjustment
- Alternative maintenance-date calculation
- Technician or shop scheduling
- Schedule modification or rescheduling tracking
- Manager escalation workflow
- Complete downstream Other Work processing
- Reservation, pickup, return, or rental-fulfillment processing

## Architecture Reference

Implementation follows [AI, Human, And Deterministic-Control Boundary](ai-human-deterministic-control-boundary.md).
