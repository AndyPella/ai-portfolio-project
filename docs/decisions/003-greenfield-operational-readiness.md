# Decision 003: Greenfield Operational-Readiness Demonstration

- **Status:** Accepted
- **Date:** 2026-08-13

## Context

Decision 002 selected application or service onboarding as the primary workflow for
the manifold demonstration.

The initial discussion considered operational onboarding through an observability
lens. That direction could resemble work already performed by an existing team and
could place the public demonstration too close to proprietary or NDA-sensitive
processes.

The demonstration also needs to show that operational readiness can influence
business processes early rather than functioning only as a final review immediately
before launch.

## Decision

The primary demonstration will focus on **general operational-readiness onboarding**
for a fictional greenfield service.

The workflow will begin during the service concept stage and progressively develop a
living operational service record through selected lifecycle stages. The information
will support a pre-launch readiness decision and remain available for operational use
after launch.

The demonstration will be independent of observability-specific and
Salesforce-derived workflows, terminology, forms, decision trees, organizational
structures, and data.

## Fictional Scenario

The working scenario will be a fictional organization introducing a new customer
appointment and notification service.

The service is understandable to a broad audience while providing realistic
operational considerations, including:

- Customers and internal users
- Business ownership
- Personal information
- Scheduling
- External messaging dependencies
- Support responsibilities
- Failure effects
- Escalation paths
- Recovery arrangements

The scenario may be refined as requirements are developed, but it must remain
fictional and public-safe.

## Selected Lifecycle Stages

The demonstration will follow the service through selected stages:

1. **Concept**
   - Establish the business problem, intended users, sponsor, owner, and expected value.
2. **Planning and design**
   - Identify affected processes, teams, systems, dependencies, data, risks, and the
     intended operating model.
3. **Build and preparation**
   - Establish responsibilities, procedures, controls, reviews, and unresolved
     decisions.
4. **Readiness evaluation**
   - Evaluate completeness, supporting evidence, contradictions, exceptions, and
     human approvals.
5. **Launch and transition**
   - Produce the operational service record, confirm responsibilities, document
     remaining risks, and record the readiness decision.
6. **Operational reuse**
   - Make the record available to later requests, incidents, problems, and service
     changes.

## Progressive Information Gathering

The manifold will not conduct one large assessment at the end of development.

Instead, its question-and-answer capability will:

- Ask questions appropriate to the current lifecycle stage
- Reuse information already provided
- Request additional evidence as risk and complexity become clearer
- Identify missing, conflicting, or unsupported information
- Track unresolved decisions and accepted exceptions
- Route matters requiring specialist or accountable-owner judgment
- Maintain a record that develops with the service

## Target Participants

The fictional workflow may involve:

- Service requester
- Business sponsor
- Service owner
- Readiness coordinator
- Domain reviewers
- Operations or support roles
- Launch or change authority
- Downstream operational processes

These are capability-oriented roles and do not assume a particular organizational
structure.

## Scope Boundary

The prototype will demonstrate how operational readiness follows a greenfield
service through selected lifecycle stages.

It will not implement:

- A complete product-development methodology
- A project-management platform
- Every possible organizational review
- Production integrations
- An observability-onboarding process
- Internal Salesforce processes or artifacts

The primary implemented workflow remains operational-readiness onboarding. Lifecycle
coverage demonstrates the framework's depth without creating multiple complete
applications.

## Consequences

This decision:

- Separates the public demo from observability-specific and proprietary work.
- Makes operational readiness relevant from concept through launch.
- Shows how the manifold can influence multiple business functions.
- Produces information that remains valuable after launch.
- Strengthens the downstream incident, problem, and request examples.
- Requires careful scope control so lifecycle depth does not become an attempt to
  build an entire product-development platform.
