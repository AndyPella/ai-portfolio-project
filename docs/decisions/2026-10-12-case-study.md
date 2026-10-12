# Approved portfolio case study

Approved October 12, 2026. Focus: complex process design and product judgment, with AI as a development tool. The build-method section describes the iterative workflow without a personal name or PR number. Early release is intentionally omitted from the demo interface. Presentation review remains pending until the planned local reload.

### Project overview

Northstar Ridge demonstrates the translation of a complex operational process into clear requirements and a working product. The fictional equipment rental business provides a setting for coordinating availability, safety, maintenance, customer intake, and approval requirements.

The project demonstrates product definition, process design, scope management, and validation. AI served as a development tool for exploring options and producing implementation, tests, and documentation.

### The problem

Customer Service needs to determine whether equipment can be offered for a requested rental period, often while a customer waits on the phone.

Calendar availability is only part of the answer. A rental decision also depends on safety checks, maintenance requirements, active holds, customer information, and operating conditions. The workflow brings these factors together into a recommendation for staff review and customer acceptance.

### Product ownership and approach

Andrew Pella’s contribution covered:

- Business requirements and rental-readiness definitions.
- Exception handling, staff authority, and approval boundaries.
- Scope decisions and implementation priorities.
- Scenario review, acceptance criteria, and evaluation of resulting behavior.

Concrete customer scenarios exposed dependencies involving maintenance timing, unresolved holds, incomplete paperwork, and changes after approval. These findings informed the requirements and workflow.

This was an individual project developed with AI assistance. Business reasoning, priorities, scope decisions, and acceptance judgments remained Andrew’s responsibility.

### Key decisions

**Reduce manual interactions while retaining human approval**

The workflow consolidates equipment selection, maintenance and hold checks, rental-date comparisons, and required conditions. The goal is to reduce the manual interactions needed to reach critical information.

Routine preparation proceeds automatically. Missing or conflicting evidence requires qualified review. Staff approval and customer acceptance remain necessary before rental confirmation; approval cannot override a safety blocker.

The demo uses deterministic rules to represent this preparation. Reductions in task time and human interactions have not been measured.

**Distinguish required work from permitted maintenance delays**

Safety or operationally critical work prevents operation until completed and verified. Noncritical work may permit rental within a defined deferral limit: seven calendar days or 25 operating hours, whichever comes first. Tighter task or warranty requirements take precedence.

The maintenance record captures the supporting classification and assessment. These fictional policies demonstrate how explicit limits and recorded evidence support consistent decisions.

**Protect equipment during customer intake**

A four-hour temporary allocation protects selected equipment while customer information and the rental agreement are completed.

Customer acceptance changes the allocation to confirmed. Expiry releases it, and renewed protection requires fresh staff approval.

Early release was intentionally excluded from the lightweight demo. It remains part of the intended cancellation workflow.

**Use fictional, version-controlled data**

Fictional records allow realistic scenarios without exposing customer, employee, or business information.

The authoritative dataset moved from Google Sheets to repository-based JSON. This removed a runtime dependency on Google Drive and made data changes reviewable alongside implementation changes. The demo and tests use the same dataset.

### From requirements to working product

Three guided scenarios demonstrate the core decisions:

| Scenario | Product behavior |
|---|---|
| Ready to rent | Review availability and customer checks, protect equipment, approve the proposal, and record acceptance. |
| Blocked rental | Identify missing inspection evidence and an active hold; require qualified resolution before proceeding. |
| Ready with conditions | Present required service and operating restrictions before customer acceptance. |

Equipment search and dropdown selection provide consistent access to recorded units. Readiness findings determine the available actions.

Scenario review also informed shorter responses, readable service times, and renewed approval after request changes.

### Build method

The build followed an iterative workflow. Requirements were defined, AI proposed a solution, and the proposal was reviewed against the business needs and scope. Changes were presented, refined, and accepted before implementation.

The resulting behavior was validated through scenarios and tests. Findings fed back into the requirements and proposed solutions, repeating the cycle where further refinement was needed.

### Validation and boundaries

Validation covered ready rentals, inspection and hold resolution, service conditions, customer checks, callbacks, temporary allocation expiry, and equipment-selection consistency. Automated domain tests and browser checks supported scenario review.

The implemented scope uses fictional data, sample staff roles, and deterministic responses. Live AI, production authentication, customer-system integration, and early release of temporary allocations remain future work.

Known defects are documented separately as an operational extension. Passing tests supports the behaviors checked; it does not establish that the product is defect-free.
