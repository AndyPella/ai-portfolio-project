# Demo Capability Talking Points

- **Purpose:** Interview and portfolio discussion guide
- **Demonstration:** Northstar Ridge Equipment Readiness
- **Current evidence:** Documented customer-service and mechanic workflows
- **Status note:** Workflow capabilities are designed and documented; implementation
  evidence will be added after the working prototype is built and tested.

## Core Message

> The demonstration shows more than a conversational interface. It combines
> operational-process design, AI-assisted interaction, human decision gates,
> deterministic business rules, role-based experiences, and integration-aware
> architecture. AI assists real work while authoritative data, traditional code, and
> accountable employees retain control of operational decisions.

## 1. Business And Operational Process Design

### What the demonstration shows

- Multiple operational entry points
- End-to-end process sequencing
- Role and responsibility definition
- Cross-functional dependencies and impacts
- Operational prioritization
- Status transitions and alerting
- Exception and alternative-path handling
- Process handoffs
- Clear workflow endpoints
- Scope and dependency management

### Evidence in the workflows

The customer-service workflow begins with an equipment need or identifier and ends with
an illustrative handoff to the existing rental process. The mechanic workflow begins
with an equipment or work request and ends with the equipment either remaining on
Mechanic Hold or returning to Ready to Rent.

The design accounts for inspection, maintenance, parts, scheduling, branch location,
and rental-process dependencies without attempting to implement every dependent
business process.

### How to speak to it

> I started with the operational objective and the people doing the work. I then
> defined the sequence, decision points, status changes, exceptions, dependencies, and
> handoffs. That allowed the workflow to remain realistic without expanding into a
> complete rental, CRM, parts, or scheduling platform.

## 2. AI-Assisted Interaction Design

### What the demonstration shows

- Natural-language intake
- Intent recognition
- Equipment terminology interpretation
- Identifier normalization and fuzzy-match suggestions
- Context-aware follow-up questions
- Conversational context preservation
- Plain-language summaries
- Explanation of readiness, availability, and restrictions
- AI-assisted presentation of ranked choices
- Recognition of uncertainty and requests for clarification

### Evidence in the workflows

A user may enter “I need a grader,” an Equipment ID, a serial number, or a mechanic
request such as “show equipment needing inspection.” The AI interprets the request,
asks only for missing context, and explains results. It requires confirmation when an
identifier or equipment term is uncertain.

### How to speak to it

> I used AI where language and context add value: understanding intent, resolving
> terminology, asking focused questions, preserving context, and explaining the result.
> I did not use AI as the authority for safety, readiness, or availability decisions.

## 3. Human Decisions, Controls, And Assurance

### What the demonstration shows

- Human-in-the-loop decision points
- Confirmation of uncertain matches
- Customer acceptance of planned interruptions
- Mechanic Hold initiation
- Mechanic certification of completed work
- Human-confirmed release of a hold
- Escalation for conflicting or incomplete evidence
- Fail-safe behavior
- Prevention of unauthorized overrides
- Traceable decisions and approvals

### Evidence in the workflows

Customer service confirms uncertain matches and records customer acceptance of planned
work. A mechanic selects the reason for Mechanic Hold, confirms work evidence, and
makes the final recorded decision to release the hold when deterministic rules permit
it.

### How to speak to it

> Human gates are placed where judgment, acceptance, certification, or accountability
> matters. The system supports the decision and records it, but it does not hide or
> replace the accountable person.

## 4. Data, Rules, And State Management

### What the demonstration shows

- Authoritative equipment identification
- Structured data relationships
- Readiness and availability calculations
- Inspection chronology
- Maintenance thresholds
- Three-day pre-rental evaluation window
- Twenty-four-hour completion buffer
- Interruption-based ranking
- Equipment state transitions
- Deterministic decision rules
- Audit events and supporting evidence

### Evidence in the workflows

Equipment ID is the primary identifier and serial number is secondary. Inspection,
maintenance, defect, reservation, and service-capability records inform deterministic
results. Mechanic Hold is an operational control; Equipment Readiness is calculated;
rental availability remains a separate time- and context-specific result.

### How to speak to it

> I separated conversational interpretation from business control. Deterministic code
> evaluates authoritative data, applies timing and safety rules, manages state
> transitions, and produces repeatable results that can be tested and audited.

## 5. Role-Based User Experience

### What the demonstration shows

- Customer-service/front-counter view
- Mechanic work view
- Manager operational overview
- General-user inventory view
- Role-specific permissions
- Progressive disclosure
- Search by need or identifier
- Work-focused and business-focused summaries
- Clear status presentation
- Navigation that preserves equipment and workflow context

### Evidence in the workflows

Customer service sees business-facing readiness, availability, conditions, and
alternatives without unnecessary technical detail. Mechanics see required work,
defects, evidence, parts availability, Mechanic Hold, and Ready-to-Rent controls.

### How to speak to it

> The same underlying equipment record supports different experiences. Each role sees
> the information and actions needed for its task, while permissions and progressive
> disclosure prevent unnecessary access and complexity.

## 6. Architecture, Integration, And Extensibility

### What the demonstration shows

- Separation of AI, human, and deterministic processing
- Existing-system integration points
- Mock data representing future connections
- Parts and materials dependencies
- Rental-scheduling dependencies
- CRM and branch-transfer boundaries
- Reusable workflow components
- Configurable business policies
- Controlled extension points
- Privacy and NDA-safe data handling
- Explicit scope decisions
- Requirements traceability through commits and pull requests

### Evidence in the workflows

Mock customer, reservation, parts, and scheduling information shows where existing
systems would connect. The demo exposes handoffs for processes it does not implement,
including CRM callbacks, equipment transfer, parts management, and maintenance
rescheduling.

### How to speak to it

> I designed the workflow as part of a larger operating environment. Dependencies and
> extension points are visible, but the prototype stays focused. That demonstrates
> integration awareness and scope discipline at the same time.

## Combined Capability Statement

> Together, the two workflows demonstrate business-process analysis, cross-functional
> awareness, conversational AI design, deterministic controls, human decision gates,
> role-based experience design, state management, exception handling, integration
> thinking, and disciplined scope management.

## Important Evidence Boundary

The current repository proves the discovery, requirements, decision, and workflow
design process. The implementation phase must still prove the selected capabilities
with:

- Working code
- Prompt and tool behavior
- Deterministic rule tests
- Human-gate interactions
- State-transition tests
- Audit records
- Normal, exception, and contradictory-data scenarios
- Git commits, pull requests, failed tests, and documented corrections
