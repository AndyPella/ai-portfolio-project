# Decision 004: Equipment-Rental Operational-Readiness Scenario

- **Status:** Accepted
- **Date:** 2026-08-13

## Context

Decision 003 selected general operational-readiness onboarding for a fictional
greenfield service and allowed the working scenario to be refined during requirements
development.

The demonstration is limited to internal business and operational processes. It is
not intended to become a customer-facing application, CRM demonstration, asset
qualification model, or M&A systems-integration workflow.

## Decision

The fictional company is **Northstar Ridge Equipment Group**, a medium-sized
equipment-rental business serving homeowner, construction, and industrial markets.

The company operates in a growing market and expands primarily by acquiring existing
rental businesses or locations rather than building every new operation from the
ground up.

The name is fictional. “Northstar” reinforces the concept of a defined operational
objective, while “Equipment Group” fits an acquisition-led parent organization whose
acquired locations may temporarily retain local identities.

The greenfield internal service will establish a consistent equipment-readiness
process across existing and acquired operations.

## Demonstrated Workflow

The workflow begins when an already-qualified equipment item enters operational
readiness.

It will gather and evaluate the internal information, evidence, remediation, and
approvals required to reach the status:

> **Equipment Ready**

Equipment Ready is the endpoint of the current demonstration and an extension point
for possible downstream processes.

## Internal Users

Potential internal participants include:

- Inventory coordinators
- Yard or warehouse staff
- Equipment inspectors
- Maintenance technicians
- Delivery and pickup coordinators
- Billing or administrative staff
- Branch operations managers
- Readiness or exception reviewers

Customers are not users of the demonstrated workflow.

## Customer-Data Connection

The workflow may retrieve limited customer context from an authorized, already
connected company data source when that context changes operational readiness
conditions.

Examples may include customer type, service location, contract requirements,
documentation requirements, or site restrictions.

The demonstration will not create, update, or manage CRM records, customer
relationships, leads, opportunities, marketing activity, or credit decisions.

## Upstream and Downstream Boundaries

Upstream asset qualification and M&A system migration or integration are dependencies,
not processes implemented by this demonstration.

Possible downstream extensions after Equipment Ready include:

- Availability and allocation
- Reservation or order fulfillment
- Delivery or pickup preparation
- Rental release
- Return and inspection
- Maintenance management
- Transfer between locations

A focused, read-only availability evaluation may be used to prove the Equipment Ready
extension point. Operational management of the downstream processes remains outside
the initial implementation.

## Consequences

This decision:

- Gives the operational-readiness workflow a concrete internal business setting.
- Demonstrates acquisition-led operational standardization.
- Connects equipment, customer, and operational data without becoming a CRM.
- Establishes a clear start and end state.
- Preserves future hooks without expanding the first prototype.
- Requires explicit assumptions for upstream qualification and system availability.
