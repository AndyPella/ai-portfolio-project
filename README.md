# AI Portfolio Project

A professional portfolio demo showing how AI-assisted workflow design can be used to translate an operational problem into requirements, structured data, validation checks, and an implementation-ready product foundation.

The demo uses a fictional equipment rental company, Northstar Ridge, to model equipment readiness, reservation availability, maintenance holds, inspection status, and role-specific workflows for customer service, mechanics, and managers.

## What this demonstrates

- Product discovery and problem framing for an operational workflow
- Requirements decomposition from business rules into testable behavior
- Human-in-the-loop workflow design and exception handling
- Data modeling for equipment, reservations, inspections, and maintenance state
- Validation checks that reduce bad inputs and inconsistent operational decisions
- AI-assisted prototyping discipline: clear assumptions, documented decisions, and verification before expansion
- Implementation fluency with a TypeScript / Next.js application foundation

## Current status

This repository is a portfolio case study and working prototype foundation. The current application provides a responsive public-facing base, structured data, workflow documentation, and automated validation tests. The Customer Service, Mechanic, and Manager workflow paths are documented and staged for continued UI implementation.

This is intentionally not presented as a finished production product. The value of the project is the product thinking, workflow structure, implementation approach, and validation evidence behind the prototype.

## Why this project exists

Many operational teams need automation, but full autonomy is not always the right first step. This demo explores how an AI-assisted workflow can support better decisions while keeping human review available for ambiguous, risky, or exception-heavy cases.

The project is designed to show the work behind a responsible prototype: assumptions, constraints, decision records, data snapshots, acceptance criteria, and tests.

## Public-safe content

This project uses fictional company data and synthetic operational scenarios. It does not include employer-confidential information, proprietary systems, customer data, credentials, or internal business records.

## Run the application locally

Prerequisites:

- Node.js 20.9 or later
- npm 10 or later

Install dependencies and start the development server:

```bash
npm install
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
