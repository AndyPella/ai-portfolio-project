# Mechanic Equipment Work Workflow

- **Status:** Working decisions
- **Role:** Mechanics
- **Primary identifier:** Equipment ID
- **Current decision checkpoint:** Questions 1–5 accepted

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

## Architecture Reference

Implementation follows [AI, Human, And Deterministic-Control Boundary](ai-human-deterministic-control-boundary.md).
