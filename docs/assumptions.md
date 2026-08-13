# Assumptions Register

This register records conditions treated as true for the prototype so dependent
business processes can be acknowledged without being implemented.

Assumptions should be revisited if the scenario, workflow boundary, or evidence model
changes.

## A-001: Equipment Has Passed Asset Qualification

- **Status:** Accepted
- **Applies to:** Every equipment item represented in the prototype

All represented equipment has completed the organization's asset qualification
process and has been approved for inclusion in the working asset pool before entering
the demonstrated operational-readiness workflow.

The prototype assumes that all applicable qualification gates have been met,
including determinations concerning:

- Age and condition
- Remaining useful life
- Financial justification
- Expected operational value
- Manufacturer and model fit with the fleet strategy
- Maintenance, parts, training, and replacement implications

Asset valuation, acquisition assessment, financial analysis, manufacturer
rationalization, and fleet portfolio selection are upstream dependencies and outside
the prototype's scope.

The demonstrated workflow will not repeat or reverse the qualification decision.

## A-002: Acquired Systems and Data Are Operationally Available

- **Status:** Accepted
- **Applies to:** Equipment, customer, and relevant operational information

All systems and data required by the demonstration have already been migrated into,
or connected with, the acquiring company's environment. They function as part of
normal company data and business operations before equipment enters the demonstrated
workflow.

The prototype assumes that:

- Required equipment records are accessible.
- Required customer reference data is accessible.
- Relevant operational records are accessible.
- Asset and customer identifiers are sufficiently consistent for the demonstrated use.
- Authorized internal users and processes can retrieve the required information.
- Major migration, mapping, reconciliation, connection, and cutover issues have been
  resolved.

M&A system assessment, migration, integration, mapping, reconciliation, and cutover
are outside the current prototype. They may become the subject of a separate future
demonstration.

A simulated retrieval from an already-connected source may be used to demonstrate the
current workflow. This does not make systems integration part of the demonstrated
business process.

## A-003: Customer Data Is a Limited Internal Reference Source

- **Status:** Accepted
- **Applies to:** Customer context used by internal operational decisions

Customer information required for internal operational decisions is available through
an authorized, already-connected company data source.

The prototype may retrieve only the customer context needed to evaluate equipment
readiness, such as:

- Customer identifier
- Customer type
- Service location
- Contract requirements
- Required documentation
- Delivery or site restrictions
- Equipment or configuration requirements relevant to operational preparation

The prototype will not:

- Create or update customer records
- Manage customer relationships
- Track leads or sales opportunities
- Perform marketing activity
- Perform customer-data migration or consolidation
- Determine customer creditworthiness
- Replace or reproduce a CRM

Customer data may add readiness conditions, but the workflow will still end at
**Equipment Ready**. Reservation, allocation, fulfillment, and rental processing
remain downstream and outside the initial implementation.
