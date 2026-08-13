# Customer Service Inventory Search Workflow

- **Status:** Accepted working workflow
- **Role:** Customer service and front-counter staff
- **Primary outcome:** An equipment selection summary for handoff to the existing rental process
- **Scope boundary:** The workflow does not create, allocate, confirm, or fulfill a reservation

## Objective

Help customer service find suitable equipment using conversational input, evaluate
readiness and availability in operational context, present ranked alternatives, and
produce an illustrative handoff summary.

## Agreed Workflow Decisions

### Combined Conversational Entry

Use one intelligent input rather than separate identifier and equipment-need screens.
It accepts:

- Natural-language needs, such as “I need a grader.”
- Equipment IDs.
- Serial numbers as a secondary lookup.

The system determines the input type and continues through the appropriate path.

### Location-Aware Progressive Search

For an equipment-type request, the system uses the employee's current branch or work
location as the default. It shows the quantity available now and asks for rental dates.

If the request already contains a location and dates, the system extracts them and
searches directly. An explicitly entered location overrides the default.

### Nearby-Branch Alternatives

When no suitable unit is available at the requested location and dates, the system
automatically searches nearby branches. Alternatives clearly identify their location
and any transfer or alternate-pickup implication. The demo does not implement transfer
or pickup arrangements.

### Flexible Identifier Recognition

Identifier lookup normalizes safe formatting differences, including capitalization,
spaces, expected dashes, and leading or trailing whitespace.

For example, `EQ-1001`, `EQ1001`, `eq 1001`, and `eq-1001` resolve to the same
canonical Equipment ID.

Broader fuzzy matches are suggestions only. A possible match must be confirmed before
the workflow continues; the system never silently substitutes a different asset.

### Basic Exact-Match Summary

After an exact asset match, customer service sees:

- Equipment ID
- Equipment type
- Manufacturer and model
- Serial number as a secondary reference
- Current location
- Current condition
- Equipment Readiness Outcome
- Plain-language explanation when action is required

Technical inspection and maintenance records remain outside the basic view.

### Operational-Interruption Ranking

When several units match, rank from least to greatest operational interruption:

1. Available with no inspection or maintenance interruption.
2. Available with completed pre-rental work.
3. Available with confirmed work completing safely before rental.
4. Available with confirmed work close to rental start.
5. Available with unconfirmed or incomplete pre-rental work.
6. Available with an interruption during rental.
7. Unavailable because required work causes a full outage.

Within the same interruption level, prefer the requested/current location, stronger
readiness, shorter interruption, and then shorter nearby-branch distance.

The system presents ranked options but does not allocate equipment automatically.

### Evaluation Window

Show inspection and maintenance activity occurring from three days before the requested
rental start through the requested rental end.

For each relevant activity, show plain-language information about:

- Work type
- Scheduled date and time
- Expected duration
- Whether it is before or during the rental
- Whether on-site work is permitted
- Expected operational interruption
- Effect on availability

### Timing-Aware Pre-Rental Ranking

Work in the three-day pre-rental window affects ranking according to completion state,
confirmed parts and personnel, planned completion time, duration, risk to the rental
start, and overlap with the requested rental period.

Completed or well-confirmed work ranks above incomplete, uncertain, or overlapping
work.

### Twenty-Four-Hour Completion Buffer

Required inspection or maintenance must finish at least 24 hours before the rental
starts to avoid a start-time risk.

Work finishing less than 24 hours before rental ranks lower and is identified as a
risk. Unconfirmed work produces a conditional or remediation outcome. Full-outage work
during the rental makes the unit unavailable.

The 24-hour buffer is fixed for the demo and configurable in a future implementation.

### Illustrative Selection Summary

After selecting a suitable Equipment ID, show a popup, drawer, or summary screen with:

- Mock reservation reference
- Equipment ID and description
- Pickup or service location
- Requested start and end dates
- Equipment Readiness Outcome
- Availability Outcome
- Relevant inspection or maintenance in the evaluation window
- Expected interruption or conditions
- Customer-service notes
- Handoff instruction for the existing rental process

The reservation reference is visibly labeled mock, illustrative, or not submitted.

### Conditional-Work Acknowledgement

Before showing the illustrative selection summary for equipment with planned work or an
interruption, customer service records:

> Customer verified and accepted planned work.

The demo records the acknowledgement, employee confirmation, date and time, referenced
equipment and planned work, and an optional short note.

It does not implement identity verification, signatures, consent documents, customer
communications, contract changes, CRM updates, or legal acceptance.

### Customer Declines Conditions

If the customer declines planned work or interruption, return to the ranked results
while preserving equipment type, dates, location, capabilities, and other search
context.

Show alternatives without the declined condition. Do not automatically select a
replacement.

If no compliant alternative exists, terminate the selection with **No suitable
equipment available for the requested period**. Required inspection or maintenance
cannot be waived, postponed, or bypassed.

### Alternative Dates

When the original period cannot be satisfied, offer valid alternative date ranges.

The earliest possible alternative begins after required work completion plus the
24-hour buffer. Each alternative preserves the requested rental duration and is
reevaluated for readiness, reservations, inspection, maintenance, and the three-day
pre-rental window.

### All Ranked Alternatives

Show every valid alternative date found within the configured search period. Rank by:

1. No operational interruption
2. Smallest change from the requested dates
3. Requested or current location
4. Equipment Readiness Outcome
5. Completed or confirmed pre-rental work
6. Lowest timing risk
7. Shortest nearby-branch distance
8. Least interruption when interruption-free choices do not exist

### Thirty-Day Search Horizon

Search for alternatives through 30 days after the originally requested start date.

If no valid result exists, return **No suitable equipment or alternative dates were
found within 30 days of the requested start date**.

### Confirmed Equipment Terminology

Recognize common terminology, abbreviations, singular/plural forms, and clear spelling
variations. Confirm the interpreted inventory term before searching when normalization
could change meaning.

Ambiguous terms produce choices rather than silent substitution. For example, “lift”
requires clarification among applicable lift equipment types.

### Conditional Capability Questions

Ask capability questions only when multiple configurations exist or recorded
requirements affect suitability. Examples include capacity, height, attachments, site
constraints, or intended work.

Confirmed capabilities remain in the search context and apply to local, nearby-branch,
and alternative-date results. The system does not recommend equipment outside its
recorded capabilities.

### Display-Only Mock Customer Context

Customer context is not required for the equipment search. The final illustrative
summary may show clearly labeled mock customer information to demonstrate a future
integration point.

Mock customer or site information is display-only. It does not affect matching,
readiness, availability, ranking, maintenance, inspection, or alternatives.

## Normal Flow

1. Customer service enters a need, Equipment ID, or serial number.
2. The system normalizes and interprets the input.
3. The system confirms ambiguous equipment terminology or suggested identifier matches.
4. The system uses the current location unless another location was supplied.
5. The system gathers dates and only necessary capability information.
6. The system evaluates readiness and availability for the three-day pre-rental window
   through the rental end.
7. Matching units are ranked from least to greatest interruption.
8. The employee selects a specific Equipment ID.
9. Conditional work requires recorded customer acknowledgement.
10. The system displays an illustrative reservation and handoff summary.

## Terminal Outcomes

- Suitable equipment selected for consideration
- Customer declined conditions and another option is available
- No suitable equipment for the requested period
- Alternative dates available within 30 days
- No suitable equipment or alternative dates within 30 days
- Identifier or equipment terminology requires clarification
- Human review required because evidence is missing or contradictory

## Explicit Exclusions

- New inventory intake
- Equipment allocation
- Reservation creation or confirmation
- Rental pickup, return, or fulfillment
- Equipment transfer execution
- CRM retrieval or updates
- Customer identity or consent workflow
- Waiving required inspection or maintenance
- Customer-service condition-reporting workflow
