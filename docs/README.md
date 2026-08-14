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
| `data-snapshot-workflow.md` | Authoritative Sheet-to-snapshot workflow and normalization rules |

## Latest Checkpoint

- [Post-PR #13 Project Progress Checkpoint](checkpoints/2026-08-14-post-pr-13.md)

## Working Dataset

- **Name:** Northstar Ridge Equipment Readiness Demo Data
- **Location:** Private project Google Drive
- **Editable source:** Private Google Sheet
- **Runtime snapshot:** `data/northstar-ridge-demo-data.json`
- **Purpose:** Fictional seed records and repeatable test scenarios
- **Classification:** Fictional and public-safe
- **Repository references:**
  - [Equipment Readiness Data Model](requirements/equipment-readiness-data-model.md)
  - [Role-Based Equipment Views](requirements/role-based-user-views.md)
  - [Customer Service Inventory Search Workflow](architecture/customer-service-inventory-search-workflow.md)
  - [Mechanic Equipment Work Workflow](architecture/mechanic-equipment-work-workflow.md)
  - [AI, Human, And Deterministic-Control Boundary](architecture/ai-human-deterministic-control-boundary.md)

The private Google Drive link is intentionally not published in repository
documentation.

See [Northstar Ridge Data Snapshot Workflow](data-snapshot-workflow.md) for the
authoritative Google Sheet → reviewed JSON snapshot → application process.

## Working Rule

Preserve the complete evidence here, then curate only the strongest evidence for the
public portfolio. Do not include employer-confidential information, credentials,
personal data, or private-resource links.
