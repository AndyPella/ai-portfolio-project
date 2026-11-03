# Continuous rental product workspace

Approved visual direction: the November 3 equipment rental inquiry mockup. Implement this as the development UI in PR 18 for local acceptance testing.

## Implemented experience

- A dedicated `/workspace` route presents the application without the portfolio introduction above it. The landing-page role links enter this route; the introduction and supporting pages remain available.
- Forest-green app navigation, a compact role selector, equipment results, an in-place customer section and agreement section, a persistent rental summary, and a common action bar replace the disconnected workspace panels.
- Equipment type/unit, Pacific pickup/return date-time fields, and expected use share one form. Changes require reevaluation before proceeding. Search and list selections update the same request without an evidence interruption.
- Proceed to rent applies the existing four-hour protection and expands customer details in place. Existing/New/Uncertain route choices remain routine. Existing-customer lookup filters the fictional customer examples already represented by rental requests; no CRM or registration integration is implied.
- Required verification/approval actions collect their reason and reference inline in the summary, without a modal overlay. They still use the existing domain commands and authority checks. Back/Escape cancels the pending action without recording it.
- Blocking reasons, required service conditions, readiness evidence, qualified resolution and callbacks remain accessible. The Activity navigation opens existing decision/allocation history.
- Customer forms and evidence entry are retained during section and role navigation. Unsaved rental/intake changes prevent approval/acceptance until saved and reevaluated.
- Operating schedules use ordinary date/time/hour inputs instead of requiring JSON entry. The canonical timestamp data and service-window checks remain unchanged.

## Scope and preserved behavior

Use the actual seven-unit dataset and September 2026 demo clock. The additional excavator and November dates in the visual mockup were illustrative; no invented equipment or new availability promises were added. Role visibility, four-hour expiry, fresh approval, customer checks, and safety/maintenance gates continue to apply. The two documented bugs remain Open and unfixed. No merge or public deployment is part of this change.

## Validation

Production build (including lint/type checks) and all 75 domain tests pass. The browser preview uses the actual prerendered workspace and client bundle: routine availability/proceed actions, in-place customer routing, staff approval/customer acceptance, required service acceptance, all seven units through list and serial search, blocker review, role switching, separate inspection/hold release, and expiry/renewal were exercised. Responsive styles are included; final local visual acceptance remains with the user.

The Playwright smoke test is updated for the new route and inline controls, including desktop/mobile assertions. In this managed environment the standard Next dev preview receives incompatible Vite flags, so browser checks used a static copy of the compiled pages through the supported preview service. The full standalone Playwright runner was not executed in this environment.

## Local test

Use branch `ui/rental-workspace-role-views-2026-10-12`, pull the latest commit, and start `npm run dev -- --hostname 127.0.0.1`. Open `http://localhost:3000/workspace`.

Start with the ready inquiry, then open Demo tools & sample inquiries for blocked and conditional examples. Review the actual UI before approving PR 18. For the automated browser suite locally, build first and run `npm run test:ui` with a supported Playwright browser installed.
