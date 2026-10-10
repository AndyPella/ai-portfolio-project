# Northstar Ridge — AI-Assisted Operations Product Case Study

**Built by Andy Pella | Senior Product Manager — Platforms, Observability, Automation & AI-Assisted Operations**

This portfolio project demonstrates how a senior technical product leader can take an ambiguous operational problem, structure it, define the human/automation/AI boundaries, translate it into requirements and architecture, and validate an implementation-ready product foundation.

The demo uses a fictional equipment rental company, Northstar Ridge, to model equipment readiness, reservation availability, maintenance holds, inspection status, and role-specific workflows for customer service, mechanics, and managers.

## The product challenge

**Problem:** Operational teams need reliable equipment-readiness decisions across reservations, inspections, maintenance, and customer commitments.

**Product question:** What should be automated, what should remain deterministic, and where should human review stay in the loop?

**Outcome:** A working product foundation with documented requirements, architecture, synthetic operational data, role-based workflows, automated validation, and a TypeScript / Next.js prototype.

The artifact being demonstrated is the product-development process, not just the UI.

## What this demonstrates

- Product discovery and problem framing for an operational workflow
- Requirements decomposition from business rules into testable behavior
- Human-in-the-loop workflow design and exception handling
- Explicit AI, human, and deterministic-control boundaries
- Data modeling for equipment, reservations, inspections, and maintenance state
- Validation checks that reduce bad inputs and inconsistent operational decisions
- AI-assisted prototyping discipline: clear assumptions, documented decisions, and verification before expansion
- Implementation fluency with a TypeScript / Next.js application foundation

## Current status

The application now implements rental eligibility and an in-memory Customer Service workflow: automatic proposals, explicit customer checks, four-hour protection, approval/acceptance, expiry, callbacks and qualified maintenance/inspection/hold release. Manager decisions enforce policy and warranty limits. Current readiness, requested-period forecasts, evidence and decision history remain separate.

Brief summaries are deterministic templates, visibly labeled; live AI interpretation remains a follow-up. Demo roles are sample identities, not production authentication. No production booking, CRM, rental fulfillment or dispatch calls are made.

The project is intentionally focused on the quality of the product thinking, workflow structure, implementation approach, and validation evidence behind the prototype rather than presenting an incomplete UI as a finished production product.

## Why this project exists

Many operational teams need automation, but full autonomy is not always the right first step. This demo explores how an AI-assisted workflow can support better decisions while keeping human review available for ambiguous, risky, or exception-heavy cases.

The project is designed to show the work behind a responsible prototype: assumptions, constraints, decision records, data snapshots, acceptance criteria, tests, and explicit control boundaries.

## Public-safe content

This project uses fictional company data and synthetic operational scenarios. It does not include employer-confidential information, proprietary systems, customer data, credentials, or internal business records.

## Run the application locally

Prerequisites:

- Node.js 22.6 or later (tests use experimental TypeScript stripping; verified on Node 24.19.0)
- npm 10 or later

Install dependencies and start the development server:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser. The demo currently uses no API keys or environment variables.

## Verification commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Documentation

Start with [docs/README.md](docs/README.md) for the documentation index.

Useful entry points:

- [Project scope](docs/project-scope.md)
- [Assumptions](docs/assumptions.md)
- [Data snapshot workflow](docs/data-snapshot-workflow.md)
- [Detailed scope](docs/scope.md)
- [Requirements](docs/requirements)
- [Architecture](docs/architecture)
- [Decision records](docs/decisions)
- [Testing evidence](docs/testing)


## Rental workflow demonstration

Open Customer Service below the role cards. The fictional clock begins September 5, 2026 to match the source scenarios; it advances while the page is open and can jump four hours for expiry testing. Enter a reason/evidence reference before recording actions. Scenario 1 demonstrates approval/acceptance; scenario 2 requires qualified inspection/release; scenario 4 requires customer-facing service acceptance; scenario 7 has a separate site-document check. Changes stay in memory and reload resets the demo.

See the [implementation checkpoint](docs/checkpoints/2026-10-10-rental-workflow-implementation.md) for the full demonstration and validation matrix.

Optional browser verification (after a successful build):

```bash
npx playwright install chromium
npm run test:ui
```

The browser smoke test covers approval/acceptance, confirmed timer retention, service decline, qualified inspection/release, expiry, customer verification, desktop/mobile overflow and browser errors. `BROWSER_EXECUTABLE` and `BROWSER_ARGS` support an installed headless browser; `UI_SCREENSHOT_DIR` optionally captures local verification images.
