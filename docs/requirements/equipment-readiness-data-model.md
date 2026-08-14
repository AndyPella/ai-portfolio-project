# Equipment Readiness Data Model

- **Status:** Working model
- **Data classification:** Fictional and public-safe
- **Working dataset:** Northstar Ridge Equipment Readiness Demo Data
- **Dataset location:** Private project Google Drive

## Purpose

This document describes the conceptual data model used to test the Northstar Ridge
Equipment Group operational-readiness demonstration.

The Google Sheet is the working seed dataset. This document preserves the record
purposes, relationships, identifiers, and scenario coverage within the repository
without publishing the private Drive link.

The records simulate information retrieved from already-connected company sources.
They are not production integrations or copies of real company data.

## Record Types

### Demo Scenarios

Defines repeatable functional and assurance tests.

Key fields:

- `scenario_id`
- `scenario_name`
- `equipment_id`
- `customer_id`
- `requested_start`
- `requested_end`
- `expected_outcome`
- `primary_reason`
- `assurance_test`

### Equipment

Provides the qualified asset identity and current general operational state.

Key fields:

- `equipment_id`
- `asset_qualification_reference`
- `equipment_type`
- `category`
- `manufacturer`
- `model`
- `model_year`
- `serial_number`
- `current_location`
- `current_status`
- `operating_hours`
- `capabilities`
- `required_attachments`
- `last_rental_end`
- `current_condition`
- `record_updated`

### Inspections

Provides inspection history, results, defects, validity, and evidence.

Key fields:

- `inspection_id`
- `equipment_id`
- `inspection_type`
- `required_after_each_rental`
- `inspection_date`
- `related_rental_id`
- `result`
- `defects_found`
- `corrective_work_reference`
- `valid_until`
- `next_due_hours`
- `performed_by_role`
- `evidence_reference`

### Maintenance

Provides date-, operating-hour-, and condition-triggered maintenance records.

Key fields:

- `maintenance_id`
- `equipment_id`
- `maintenance_type`
- `trigger_type`
- `due_date`
- `due_operating_hours`
- `estimated_duration_hours`
- `scheduled_start`
- `scheduled_end`
- `service_location_type`
- `on_site_permitted`
- `operational_interruption`
- `parts_confirmed`
- `technician_confirmed`
- `status`
- `evidence_reference`
- `expected_hours_during_rental`
- `notes`

### Reservations

Provides existing commitments and proposed rental windows for read-only availability
evaluation.

Key fields:

- `reservation_id`
- `equipment_id`
- `customer_id`
- `start_date`
- `end_date`
- `preparation_buffer_hours`
- `return_buffer_hours`
- `status`
- `location`
- `estimated_operating_hours`
- `purpose`

The prototype reads these records but does not create, update, confirm, cancel, or
fulfill reservations.

### Service Capabilities

Defines where and how an inspection or maintenance activity may be performed.

Key fields:

- `service_capability_id`
- `equipment_type`
- `work_type`
- `service_provider_type`
- `permitted_on_site`
- `facility_required`
- `estimated_duration_hours`
- `required_certification`
- `operational_interruption`
- `advance_notice_hours`

### Customer Requirements

Provides limited internal operational context. It is not a CRM record.

Key fields:

- `customer_id`
- `customer_type`
- `service_location`
- `contract_requirements`
- `required_documentation`
- `site_restrictions`
- `equipment_requirements`
- `on_site_service_allowed`
- `access_windows`
- `operational_notes`

## Derived Equipment Readiness Outcome

`equipment_readiness_outcome` is a calculated interface result rather than a
manually maintained source field. Equipment ID is the required primary identifier;
serial number is supporting information and an alternate mechanic lookup.

The readiness evaluation considers:

- Whether the required inspection occurred after the most recent rental or use.
- Whether the current required inspection passed.
- Whether unresolved inspection defects or corrective work remain.
- Whether overdue or blocking maintenance remains outstanding.
- Whether condition, status, and supporting evidence agree.

Supported readiness values are:

- `Equipment Ready`
- `Inspection Required`
- `Maintenance Required`
- `Not Ready`
- `Human Review Required`

The existing `current_status` field is source information and must not override
contradictory inspection, maintenance, defect, or condition evidence.

Equipment Readiness remains separate from an Availability Outcome. Readiness asks
whether the asset is generally operationally ready. Availability asks whether a ready
asset can support a particular period and limited operational context.

## Presentation-Only Fields

The manager view may show illustrative counts for equipment currently rented, equipment
not currently rented, pending pickup, and expected return. These mock values demonstrate
a future connected rental or CRM capability and are not authoritative records in the
current data model.

## Relationships

- One equipment record may have many inspection records.
- One equipment record may have many maintenance records.
- One equipment record may have many reservation records.
- A reservation references one equipment item and limited customer context.
- Service capabilities are selected by equipment type and work type.
- A demo scenario references one primary equipment item and, when needed, one customer
  context record.

## Source And Authority Model

| Record type | Prototype source | Intended authority |
|---|---|---|
| Equipment | Simulated connected asset source | Asset or fleet-management system |
| Inspections | Simulated connected inspection source | Inspection record system |
| Maintenance | Simulated connected maintenance source | Maintenance-management system |
| Reservations | Simulated connected scheduling source | Rental scheduling system |
| Service capabilities | Configured reference data | Company policy and service model |
| Customer requirements | Simulated limited customer reference | Authorized customer-data source |
| Demo scenarios | Test configuration | Prototype test suite |

## Scenario Coverage

| Scenario | Expected outcome | Primary assurance purpose |
|---|---|---|
| SCN-001 Ready baseline | Rental Ready | Normal path |
| SCN-002 Inspection missing | Remediation Required | Missing evidence |
| SCN-003 Facility maintenance conflict | Not Available | Schedule conflict |
| SCN-004 Conditional on-site service | Rental Ready with Conditions | Conditional decision |
| SCN-005 Reservation conflict | Not Available | Reservation conflict |
| SCN-006 Contradictory evidence | Human Review Required | Contradiction detection |
| SCN-007 Customer restriction | Remediation Required | Customer-context check |

## Data Rules

- All identifiers and records are fictional.
- Every equipment record must contain an asset qualification reference.
- Inspection chronology must be evaluated against the most recent rental date.
- Maintenance must consider both calendar and operating-hour triggers.
- Availability must cover the complete requested window, including configured buffers.
- Underlying inspection and maintenance evidence takes precedence over a summary status.
- Missing or contradictory evidence must not produce an unsupported ready result.
- Users do not directly edit the calculated Equipment Readiness Outcome.
- Manager rental-movement counts are illustrative and must be labeled as mock data.
- Customer data must remain limited to the operational context required by the test.

## Deterministic Rule Precedence

The readiness engine consumes the validated, static JSON snapshot and requires an
explicit `YYYY-MM-DD` as-of date. It does not read reservations, customers, proposed
rental dates, buffers, or projected rental operating hours. Findings are resolved in
this strict order:

1. Contradictory evidence requiring reconciliation → `Human Review Required`.
2. Explicit failed inspection or unresolved blocking defect → `Not Ready`.
3. Missing, expired, hours-due, or stale post-rental inspection → `Inspection Required`.
4. Due or overdue blocking calendar/hour maintenance → `Maintenance Required`.
5. Missing qualification, attachment, inspection, or maintenance evidence → `Human Review Required`.
6. All required controls satisfied → `Equipment Ready`.

The result includes the Equipment ID, outcome, stable reason codes, explanations,
source-record evidence references, and the supplied as-of date. `current_status`
remains context only: it can expose a contradiction but can never establish readiness
without the underlying controls.
