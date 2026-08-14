# Role-Based Equipment Views

- **Status:** Working requirements
- **Primary identifier:** Equipment ID
- **Audience:** Internal Northstar Ridge Equipment Group staff

## Purpose

This document defines the role-based views for the equipment-readiness demonstration.
The requirements describe what each role needs to see and do without deciding whether
the interface will be a new application or a screen within an existing application.

The interface supports viewing and searching current inventory and updating authorized
status or condition information. Adding new equipment is outside the current scope.

## Shared Interaction Rules

- `equipment_id` is the required primary identifier and is displayed prominently.
- `serial_number` is supporting information. Mechanics may also use it as an alternate
  lookup value.
- Views preserve the selected equipment record during navigation.
- Equipment Readiness is calculated from inspection, maintenance, defect, condition,
  and supporting evidence; users do not directly edit the calculated outcome.
- Equipment Readiness and rental availability answer different questions and remain
  separate results.
- Permissions determine which fields a role may update even when the role can view the
  associated information.
- Missing or contradictory evidence produces remediation or human review rather than
  an unsupported ready result.

## Customer Service And Front Counter

### Purpose

Help customer service and front-counter staff identify equipment and understand
whether it is ready for consideration without requiring mechanical expertise.

### Basic View

The view presents:

- Equipment ID
- Equipment type and category
- Manufacturer and model
- Serial number as a secondary reference
- Current location
- Equipment Readiness Outcome
- Current condition
- Availability Outcome after request dates or context are supplied
- Plain-language reason or required action when equipment is not ready or available

### Search And Filters

Staff may search or filter by:

- Equipment ID
- Equipment type
- Location
- Readiness outcome
- Condition

### Permitted Actions

Staff may:

- View inventory and open an equipment record.
- Review readiness and limited availability results.
- Report new condition information.
- Request review when information is missing, conflicting, or requires technical
  judgment.

Staff may not certify inspections, complete maintenance, override readiness controls,
add equipment, or manage rental fulfillment.

See [Customer Service Inventory Search Workflow](../architecture/customer-service-inventory-search-workflow.md)
for the accepted end-to-end search, ranking, alternative-date, acknowledgement, and
handoff decisions.

## Mechanics

### Purpose

Give mechanics a fast lookup that identifies the inspections, maintenance, defects,
and corrective work affecting an existing asset.

### Starting View

The mechanic starts with a reduced inventory view containing:

- Equipment ID
- Serial number
- Equipment type
- Manufacturer and model
- Current location
- Current condition
- Equipment Readiness Outcome

The mechanic may enter or scan either the Equipment ID or serial number.

### Equipment Work View

After the equipment is selected, a popup, drawer, or separate screen presents:

- Equipment ID and serial number
- Equipment description
- Current condition
- Readiness outcome and explanation
- Required inspections
- Due or outstanding maintenance
- Open defects
- Existing corrective work
- Previously scheduled work

The mechanic may select:

- Inspection
- Scheduled maintenance
- Repair
- Diagnostic assessment
- Condition update
- Other Work

Selecting an existing requirement links the activity to that inspection or maintenance
record. Authorized updates to inspection, maintenance, defect, condition, or evidence
records cause readiness to be recalculated.

### Other Work Extension

Other Work demonstrates an extension point only. The input may capture:

- Equipment ID carried from the selected record
- Work type
- Short description
- Observed condition or issue
- Priority
- Notes

The demo may confirm that the item was recorded and routed for review. It does not
implement work-order assignment, dispatch, full parts management, labor tracking,
scheduling, approval, or cost tracking.

See [Mechanic Equipment Work Workflow](../architecture/mechanic-equipment-work-workflow.md)
for the accepted lookup, hold, work evidence, parts visibility, readiness recalculation,
and Ready-to-Rent decisions.

## Managers

### Purpose

Provide an operational overview with search and limited administrative updates.

### Data-Backed Overview

The manager view presents:

- Search across all equipment
- Total equipment count
- Equipment grouped by readiness outcome
- Last inspection dates
- Missing or overdue inspections
- Inspections due within the next 30 days
- Maintenance scheduled within the next 30 days
- Maintenance completed within the previous 30 days
- Open or overdue maintenance
- Human-review cases

The demo uses a fixed 30-day reporting window. A future implementation may make the
window configurable.

### Illustrative Future Indicators

The manager dashboard may display mock summary numbers for:

- Equipment currently rented
- Equipment not currently rented
- Pending pickup
- Expected return

These values are visibly identified as illustrative. They do not link to customer or
transaction records and do not enable rental, pickup, or return workflows.

### Permitted Updates

Managers may update selected administrative information such as:

- Current location
- Review or escalation assignment
- Manager notes
- Inspection or maintenance priority
- Exception disposition

Managers may not override failed inspections or unresolved maintenance. The supporting
evidence must be resolved before readiness changes.

## General Users

### Purpose

Answer the limited question:

> Is this type of equipment currently available?

### View

General users may search by equipment type and filter by location. Results present:

- Equipment type
- Equipment ID
- Manufacturer and model
- Current location
- A simplified availability result:
  - Available
  - Currently Rented
  - Unavailable
  - Contact Customer Service

General users do not see inspection details, maintenance details, defects, readiness
logic, customer information, reservation details, or the reasons behind an unavailable
result.

## Future Customer-Service Callback

A general-user result may show a future **Request a Customer Service Callback**
extension. A later CRM integration could create and route a callback associated with
the requester and equipment type.

The current demo does not implement callback creation, customer-record updates,
assignment, tracking, or fulfillment.

## Platform Decision

The role-based interface may be delivered as either:

1. A standalone internal application.
2. A dashboard or screen within an existing application.

The platform decision remains open. The role, data, workflow, and permission
requirements are independent of that choice.
