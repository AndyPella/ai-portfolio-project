# Rental workspace UI decisions

Approved October 12, 2026. This work follows PR 17 and is isolated in a separate UI redesign PR. Implemented in this PR; user acceptance review is pending.

## Purpose

Represent a practical product interface, with functions grouped into navigable sections and explanations retained beside the relevant work. The current long page and guided instructions do not make the action sequence clear.

## Workspace organization

| Section | Functions |
|---|---|
| Customer & request | Customer details, rental dates, expected usage, delivery and pickup information. |
| Equipment & readiness | Search, equipment list, selected unit, availability, blockers and conditions. |
| Agreement & confirmation | Temporary allocation, required checks, staff approval and customer acceptance. |
| Review & resolution | Qualified maintenance actions, hold release and callbacks. |

Workers can move between sections while retaining request details, selected equipment, draft entries and session history. Keep a persistent summary of customer, rental dates, selected equipment and current status. Each section retains a short explanation of its purpose and relevant requirements.

## Guided examples and equipment selection

- Use the same application interface for guided examples and exploration.
- Choosing an example loads its sample request and proposed equipment; do not require redundant equipment selection to proceed.
- Highlight the next relevant action with an explanation and expected result.
- Keep search and the recorded equipment dropdown available together as an optional Change equipment function.
- Both selection methods update one clearly labeled Selected equipment display through the existing confirmation and reevaluation rules.
- Selection is not a readiness promise. Changes must continue to invalidate stale approval and require renewed protection where applicable.
- Ask for decision reason and evidence at the action that requires them, rather than as an unexplained preliminary step.

## Role-specific presentation

| Role | Visible functions |
|---|---|
| Customer Service | Customer intake, rental request, equipment search and readiness, agreement preparation, approval, acceptance and callbacks. |
| Mechanic | Equipment condition, inspections, maintenance tasks, service evidence, service planning and permitted hold release. |
| Manager | All sections, including exception review, record reconciliation and permitted maintenance-delay approval. |

Hide functions outside the selected role's responsibilities rather than filling the interface with disabled controls. Keep relevant shared information visible: Customer Service sees maintenance findings and rental impact; mechanics see rental timing and usage needed to assess work.

Manager visibility of all fields does not grant an override of existing action authority, qualifications, customer acceptance or safety rules. Existing domain enforcement determines whether an action is permitted; any authority-policy changes require separate decisions.

Switching sample roles preserves the current request, selected equipment and draft work. The role selector remains identified as a demo simulation, not production authentication.

## Review and scope boundaries

- Verify each role sees the appropriate sections and fields.
- Verify navigation and role changes retain working context.
- Verify guided examples make the next step clear within the same product interface.
- Verify search and dropdown results remain consistent.
- Recheck rental, maintenance, customer-check and approval gates after restructuring.
- Check desktop/mobile layout and keyboard navigation.
- Retain the existing landing introduction, portfolio background pages and separate operational extension.
- Do not implement live AI, production authentication, early temporary-allocation release or new customer-system integration in this redesign.
- NRE-BUG-001 and NRE-BUG-002 remain Open and unfixed as previously requested.
- PR 17 remains unmerged until explicitly authorized. The new PR initially targets its branch so only the UI changes appear in review; after PR 17 merges, retarget to main as appropriate.

## Implementation and verification

Implemented four navigable workspace sections with a persistent rental summary, contextual next-action guidance and optional sample requests. Section and role changes retain form state. Customer Service has customer/agreement controls and callback routing; mechanics have equipment and qualified resolution controls; managers see all sections and manager review fields. Existing domain authorization is unchanged, so visibility does not confer permission to perform another role's action.

Equipment lookup is optional when a sample request already proposes a unit. Search and list confirmation share the existing update path. Reason and evidence are requested in an action-specific confirmation dialog, with cancellation and keyboard focus handling. Landing role links select the matching sample role.

Validation: production build (including type checks), lint, all 75 domain tests, and updated browser smoke checks passed. Browser coverage includes retained unsaved entries across role/section changes; role visibility; seven-unit search/list equivalence; ambiguous and unmatched searches; sample requests; evidence confirmation/cancellation; confirmed allocation retention; service acceptance/decline; inspection and separate hold release; expiry and renewed approval; changed equipment; customer paperwork; desktop/mobile layouts without overflow or page errors.

No domain rules, dependencies, fictional dataset, or known-bug fixes were changed. User review of the combined PR 17/18 demo remains pending.
