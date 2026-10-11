# Documentation Index

This directory preserves the evidence used to select, design, build, test, and present the AI portfolio demonstrations.

| Location | Purpose |
|---|---|
| `project-scope.md` | Current project scope, constraints, and open questions |
| `scope.md` | Authoritative objective, demonstration scope, and exclusions |
| `assumptions.md` | Accepted assumptions and dependent-process boundaries |
| `decisions/` | Consequential decisions and their rationale |
| `research/` | Market, user, business, technical, and future-demo research |
| `requirements/` | Functional, nonfunctional, data, and role-based view requirements |
| `architecture/` | Workflow, system, data, integration, and control designs |
| `testing/` | Evaluation plans, scenarios, results, and revisions |
| `case-study/` | Curated employer-facing build story |
| `checkpoints/` | Dated project-state records and restart points |
| `data-snapshot-workflow.md` | Authoritative repository JSON workflow and normalization rules |

## Latest Checkpoint

- [Post-PR #13 Project Progress Checkpoint](checkpoints/2026-08-14-post-pr-13.md)

## Rental Workflow Implementation

- [Rental Readiness and Service Delay Requirements](requirements/rental-readiness-service-delay-policy.md) — accepted decisions, implemented controls and verification status.

## Bug Tracking

- [Bug workflow](testing/bug-workflow.md) — lightweight process for recording and reviewing bugs and fixes.
- [Bug log](testing/bug-log.md) — NRE-BUG-001 and NRE-BUG-002; confirmed findings that block PR 17 merge until fixed and verified.

## Working Dataset

- **Name:** Northstar Ridge Equipment Readiness Demo Data
- **Authoritative editable source and runtime dataset:** `data/northstar-ridge-demo-data.json`
- **Change control:** Pull-request review and dataset validation
- **Historical copy:** Former private Google Sheet; no ongoing synchronization
- **Purpose:** Fictional seed records and repeatable test scenarios
- **Classification:** Fictional and public-safe
- **Repository references:**
  - [Equipment Readiness Data Model](requirements/equipment-readiness-data-model.md)
  - [Role-Based Equipment Views](requirements/role-based-user-views.md)
  - [Customer Service Inventory Search Workflow](architecture/customer-service-inventory-search-workflow.md)
  - [Mechanic Equipment Work Workflow](architecture/mechanic-equipment-work-workflow.md)
  - [AI, Human, And Deterministic-Control Boundary](architecture/ai-human-deterministic-control-boundary.md)

See [Northstar Ridge Demo Data Workflow](data-snapshot-workflow.md) for the
authoritative JSON edit → validation and PR review → application process.

## Working Rule

Preserve the complete evidence here, then curate only the strongest evidence for the
public portfolio. Do not include employer-confidential information, credentials,
personal data, or private-resource links.


- [Rental workflow implementation checkpoint](checkpoints/2026-10-10-rental-workflow-implementation.md) — concrete schema mapping, seeded task reconciliation, validation and demonstration steps.
