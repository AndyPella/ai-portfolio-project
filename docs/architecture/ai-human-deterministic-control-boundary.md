# AI, Human, And Deterministic-Control Boundary

- **Status:** Accepted architecture principle
- **Applies to:** Northstar Ridge equipment-readiness demonstration

## Principle

AI interprets and assists. Deterministic rules control readiness, availability, and
operational status. Humans make or confirm decisions at defined gates.

The implementation should visibly distinguish three cooperating layers:

1. AI-assisted workflow
2. Human decisions and gates
3. Traditional data and rules processing

## AI-Assisted Workflow

AI may:

- Interpret natural-language equipment and work requests.
- Distinguish an Equipment ID, serial number, equipment need, and work request.
- Normalize common terminology and ask for clarification when meaning is uncertain.
- Gather only missing context through focused follow-up questions.
- Preserve conversational search context.
- Summarize evidence and explain outcomes in plain language.
- Present ranked choices produced from governed operational criteria.
- Assist with implementation, test creation, and code revision.

AI must not invent equipment records, silently substitute an uncertain identifier, or
independently waive a business control.

## Human Decisions And Gates

Authorized staff remain responsible for decisions such as:

- Confirming an uncertain identifier or equipment-term match.
- Selecting equipment from ranked alternatives.
- Recording customer acceptance of planned work.
- Placing an asset on Mechanic Hold.
- Selecting the reason for a hold.
- Completing or certifying inspection, maintenance, or repair evidence.
- Resolving contradictory evidence or higher-risk exceptions.
- Releasing an operational hold when the required conditions are satisfied.

The interface should make each human gate visible and record the actor, time, input,
decision, and affected Equipment ID.

## Traditional Data And Rules Processing

Deterministic code and authoritative records control:

- Exact equipment lookup and identifier normalization.
- Inspection validity and chronology.
- Maintenance due dates and operating-hour thresholds.
- Open defects and corrective-work status.
- Equipment Readiness Outcome.
- The three-day pre-rental evaluation window.
- The 24-hour completion buffer.
- Reservation and schedule conflicts used by the read-only availability proof.
- Interruption-based ranking.
- Mechanic Hold and release-state transitions.
- Permission enforcement.
- Audit events and outcome traceability.

When AI interpretation conflicts with authoritative data or deterministic rules, the
data and rules control the operational result.

## Implementation Evaluation

During implementation, explicitly assess whether each capability is best demonstrated
as:

| Capability type | Use when | Evidence to preserve |
|---|---|---|
| AI-assisted workflow | Language, ambiguity, contextual questions, or explanation adds value | Prompts, responses, tool calls, and evaluations |
| Human decision or gate | Judgment, acceptance, certification, or accountability is required | Actor, decision, timestamp, reason, and audit entry |
| Traditional processing | The outcome must be repeatable, testable, and policy-controlled | Source data, rule code, tests, and deterministic result |

Do not add AI to a step when a simple rule or data lookup is clearer, safer, and easier
to verify.

## Portfolio Evidence

The build should preserve:

- Prompts used to generate or revise code.
- Human review and acceptance decisions.
- Unit and scenario tests for normal and exception paths.
- Failed tests and resulting corrections.
- Git commits and pull-request history.
- Traceable examples showing AI interpretation followed by deterministic decisions and
  human gates.
