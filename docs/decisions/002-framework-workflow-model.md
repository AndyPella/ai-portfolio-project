# Decision 002: Framework Workflow Model and Primary Demonstration

- **Status:** Accepted
- **Date:** 2026-08-13

## Context

The project originally identified three possible workflow categories:

1. Application or service onboarding
2. Incident or problem management
3. Requests for assistance or information

During exploration, we determined that these categories should not be treated only
as competing demonstration topics. Together, they describe reusable patterns within
the manifold.

The framework must be flexible, reusable, extensible, and capable of supporting
different teams, organizational structures, and business domains.

## Decision

The initial prototype will use application or service onboarding as its primary
end-to-end workflow.

Requests for assistance or information will become a reusable question-and-answer
capability for gathering, clarifying, validating, and returning information.

Incident and problem management will demonstrate how a downstream operational
workflow can reuse the information and service record created during onboarding.

## Framework Patterns

### 1. Intake and Onboarding

This pattern receives new work, establishes its purpose, creates an initial record,
and selects the appropriate workflow.

For the primary demonstration, it will onboard an application or service.

### 2. Lifecycle and Exception Management

This pattern manages work after intake, tracks its state, identifies exceptions,
and supports investigation, escalation, and resolution.

For the primary domain, it can support incident and problem management.

### 3. Information Gathering and Response

This pattern uses an adaptive question-and-answer process to:

- Collect required information
- Ask relevant follow-up questions
- Identify missing or conflicting information
- Retrieve previously recorded information
- Explain why information is required
- Return guidance or status
- Escalate questions that require human judgment

This is a shared capability used by both intake and lifecycle workflows.

## Primary Demonstration

The first complete workflow will:

1. Receive an application or service onboarding request.
2. Gather and clarify the required operational information.
3. Evaluate the request using configurable decision logic.
4. Check the information for completeness, contradictions, and unsupported claims.
5. Route uncertain or higher-risk results for human review.
6. Produce an assured operational service record.
7. Demonstrate how incident or problem management can reuse that record.

## Portability Example

The same framework patterns can be applied to order management:

| Framework pattern | Order-management use |
|---|---|
| Intake and onboarding | Receive and validate an order |
| Information gathering and response | Collect missing order details and answer questions |
| Lifecycle and exception management | Track inventory, fulfillment, shipping, and exceptions |

The order-management example demonstrates portability. It will not be implemented
as a second complete application in the initial prototype.

## Stable Framework Capabilities

The reusable framework will provide:

- Intake
- Adaptive information gathering
- Evidence handling
- Configurable decision execution
- Assurance checks
- Workflow-state tracking
- Exception handling
- Human escalation
- Response generation
- Audit history

## Configurable Business Elements

Each implementation may define its own:

- Terminology
- Questions and required fields
- Business rules
- Decision trees
- Workflow states
- Organizational roles
- Data sources
- Permitted actions
- Integrations
- Escalation paths

## Scope Control

The prototype will fully implement only the application or service onboarding
workflow.

Question-and-answer information gathering will be implemented as a reusable
capability within that workflow.

Incident or problem management will provide a focused demonstration of downstream
reuse. Order management will remain a configuration and portability example.

The prototype will demonstrate extensibility without attempting to build a
production-ready universal workflow platform.

## Consequences

This decision:

- Provides one clear and achievable vertical demonstration.
- Shows that information collected during onboarding has continuing operational value.
- Demonstrates reuse within an IT operational domain.
- Demonstrates portability into a different business domain.
- Prevents the initial prototype from expanding into multiple complete applications.
