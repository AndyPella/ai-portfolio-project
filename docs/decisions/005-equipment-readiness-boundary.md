# Decision 005: Equipment Readiness and Rental Availability Boundary

- **Status:** Accepted
- **Date:** 2026-08-13

## Context

Decision 004 established qualified equipment as the entry condition and
**Equipment Ready** as the endpoint of the primary operational-readiness workflow.

Further scenario development identified two related but different business decisions:

1. Whether equipment meets the company's general operational-readiness requirements.
2. Whether that equipment can satisfy a specific proposed rental period and operational
   context.

Combining these decisions into one status would make the core readiness result
customer- and reservation-dependent and would weaken its reuse across downstream
processes.

## Decision

The prototype will preserve two distinct states.

### Equipment Ready

Equipment Ready means the qualified asset satisfies the company's general internal
operational-readiness requirements.

The decision considers whether:

- The asset is identifiable in company records.
- The asset qualification reference is present.
- The required inspection occurred after the most recent rental or use.
- The inspection passed and has supporting evidence.
- No unresolved blocking defect remains.
- Current maintenance requirements are satisfied.
- Required attachments and general operational documentation are present.
- Conflicting, missing, or unsupported information has been resolved or escalated.

Equipment Ready does not mean the asset is free for every possible rental period.

### Rental Ready

Rental Ready means an Equipment Ready asset can satisfy a particular proposed rental
period and the limited operational conditions associated with that request.

The focused availability evaluation may consider:

- Requested start and end dates
- Preparation, return, and turnaround buffers
- Confirmed reservations and holds
- Scheduled inspections and maintenance
- Expected operating hours during the rental
- Whether an inspection or maintenance trigger will occur during the rental
- Whether required work can be performed on-site
- The operational interruption caused by that work
- Limited customer documentation, configuration, location, and site requirements

## Scope Treatment

The fully demonstrated business workflow still produces **Equipment Ready**.

A small, read-only availability evaluation may consume that status to demonstrate the
framework's downstream hook. It may return:

- Rental Ready
- Rental Ready with Conditions
- Not Available
- Remediation Required
- Human Review Required

The prototype will not create, modify, confirm, cancel, or fulfill reservations. It
will not allocate equipment or execute a rental transaction.

## On-Site Work Classification

Inspection or maintenance work affecting a proposed rental may be classified as:

1. On-site without operational interruption
2. On-site with a planned interruption
3. Company facility required
4. External specialist required
5. Not permissible during the rental

The classification and expected duration inform the availability result but do not
schedule or dispatch the work.

## Assurance Expectations

The framework must not rely on a single status field when underlying records conflict.

Examples include:

- Equipment marked ready with an unresolved failed inspection
- Inspection dated before the most recent rental
- Maintenance due during the requested period
- A confirmed reservation overlapping the requested period
- Missing documentation required by the proposed operational context

These cases must result in remediation, an exception, or human review rather than an
unsupported ready decision.

## Consequences

This decision:

- Preserves Equipment Ready as a reusable internal state.
- Demonstrates how the state supports a downstream business decision.
- Allows reservations, maintenance, inspections, and customer context to be shown
  without building a rental-management system.
- Creates clear normal, conditional, conflict, contradiction, and human-review tests.
- Prevents downstream availability logic from silently expanding the primary workflow.
