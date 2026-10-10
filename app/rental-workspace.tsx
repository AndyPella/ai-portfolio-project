"use client";

import { useEffect, useState } from "react";
import {
  createRentalState,
  requestScope,
  type RentalDataset,
  type RentalRequest,
  type SwapPlan,
} from "../domain/rental-records";
import {
  evaluateRental,
  proposeEquipment,
  isReady,
} from "../domain/rental-availability";
import {
  applyWorkflow,
  customerGate,
  expireAllocations,
  evaluateSwap,
  type WorkflowCommand,
} from "../domain/rental-workflow";
import { validateRentalDataset } from "../domain/rental-validation";
import { findEquipment } from "../domain/equipment-search";

const START = "2026-09-05T09:00:00-07:00";
const stamp = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    dateStyle: "medium",
    timeStyle: "short",
  });
export default function RentalWorkspace({ source }: { source: RentalDataset }) {
  const [state, setState] = useState(() =>
    createRentalState(validateRentalDataset(source)),
  );
  const [now, setNow] = useState(START);
  const [requestId, setRequestId] = useState(
    source.rental_workflow.rental_requests[0].request_id,
  );
  const [actor, setActor] = useState("DEMO-CS"),
    [message, setMessage] = useState("");
  const [evidence, setEvidence] = useState(""),
    [reason, setReason] = useState("");
  const [taskId, setTaskId] = useState(""),
    [holdId, setHoldId] = useState("");
  const [serviceAt, setServiceAt] = useState("2026-10-03T09:00:00-07:00"),
    [serviceMeter, setServiceMeter] = useState(630);
  const [callbackAt, setCallbackAt] = useState("2026-09-05T13:00:00-07:00"),
    [reviewText, setReviewText] = useState("");
  const [reviewStatus, setReviewStatus] = useState<
    "Incomplete" | "Confirmed plan" | "Denied" | "Complete"
  >("Incomplete");
  const [query, setQuery] = useState("");
  const search = query.trim()
    ? findEquipment(state.dataset.equipment, query)
    : null;
  const [planStart, setPlanStart] = useState(""),
    [planEnd, setPlanEnd] = useState("");
  const [replacement, setReplacement] = useState(""),
    [swapAt, setSwapAt] = useState("2026-09-12T09:00:00-07:00"),
    [originalHours, setOriginalHours] = useState(8);
  const request = state.dataset.rental_workflow.rental_requests.find(
    (r) => r.request_id === requestId,
  )!;
  const [edit, setEdit] = useState<RentalRequest>(() =>
    structuredClone(request),
  );
  const [usageText, setUsageText] = useState(JSON.stringify(request.usage));
  const matches = proposeEquipment(state, request, now);
  const assigned = state.allocations.filter(
    (a) =>
      a.request_id === requestId &&
      (a.status === "Confirmed" ||
        (a.status === "Temporary" &&
          Date.parse(a.expires_at) > Date.parse(now))),
  );
  const equipmentId =
    assigned[0]?.equipment_id ??
    matches.proposal?.equipment_id ??
    matches.results[0]?.equipment_id;
  const baseResult = equipmentId
    ? evaluateRental(state, request, equipmentId, now)
    : null;
  const swap = state.swap_plans.find((p) => p.request_id === requestId);
  const swapResult = swap ? evaluateSwap(state, request, swap, now) : null;
  const result =
    baseResult && swapResult?.eligible
      ? {
          ...baseResult,
          outcome: "Rental Ready with Conditions" as const,
          forecast: "Eligible with confirmed replacement plan",
          summary:
            "A confirmed replacement swap can cover these dates. Confirm customer acceptance.",
          conditions: [
            ...swapResult.conditions,
            ...swapResult.results.flatMap((r) => r.conditions),
          ],
          findings: swapResult.results.flatMap((r) => r.findings),
          protected_start: swapResult.results[0].protected_start,
          protected_end: swapResult.results[0].protected_end,
        }
      : baseResult;
  const tasks = state.dataset.maintenance.filter(
    (m) => m.equipment_id === equipmentId,
  );
  const holds = state.dataset.rental_workflow.holds.filter(
    (h) => h.equipment_id === equipmentId && h.active,
  );
  const selectedTask =
    tasks.find((m) => m.maintenance_id === taskId) ?? tasks[0];
  const selectedHold = holds.find((h) => h.hold_id === holdId) ?? holds[0];
  const customer = state.dataset.rental_workflow.customer_checks.find(
    (c) => c.customer_id === request.customer_id,
  )!;
  const checks = customerGate(state, request),
    draft = state.drafts[requestId];
  const staff = state.dataset.rental_workflow.staff.find(
    (s) => s.staff_id === actor,
  )!;
  const callbacks = state.callbacks.filter((c) => c.request_id === requestId);
  const act = (
    command: Omit<WorkflowCommand, "actor" | "reason" | "evidence">,
  ) => {
    try {
      const next = applyWorkflow(
        state,
        { ...command, actor, reason, evidence } as WorkflowCommand,
        now,
      );
      setState(next);
      setMessage(command.type + " recorded. Eligibility has been reevaluated.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Action could not be completed.",
      );
    }
  };
  useEffect(() => {
    const timer = setInterval(
      () => setNow((n) => new Date(Date.parse(n) + 30000).toISOString()),
      30000,
    );
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    setState((s) => expireAllocations(s, now));
  }, [now]);
  const choose = (id: string) => {
    setRequestId(id);
    const next = structuredClone(
      state.dataset.rental_workflow.rental_requests.find(
        (r) => r.request_id === id,
      )!,
    );
    setEdit(next);
    setUsageText(JSON.stringify(next.usage));
    setMessage("");
    setTaskId("");
    setHoldId("");
  };
  const isCS = staff.role === "Customer Service",
    isMech = staff.role === "Mechanic",
    isManager = staff.role === "Manager";
  const changeIntake = (key: keyof RentalRequest["intake"], value: string) =>
    setEdit({ ...edit, intake: { ...edit.intake, [key]: value } });
  return (
    <section
      id="customer-service"
      className="rental-workspace"
      aria-labelledby="workspace-title"
    >
      <div className="workspace-heading">
        <div>
          <p className="section-kicker">Workspace 01</p>
          <h2 id="workspace-title">Customer Service</h2>
          <p>
            Find an eligible unit, resolve required checks, and prepare the
            rental agreement.
          </p>
        </div>
        <span className="demo-label">Simulation</span>
      </div>
      <p className="scope-note">
        Fictional policies and sample staff identities. Changes stay in this
        session. Summaries are grounded templates; this demo makes no live AI,
        booking, CRM or dispatch calls.
      </p>
      <div className="workspace-toolbar">
        <label>
          Demo request
          <select value={requestId} onChange={(e) => choose(e.target.value)}>
            {source.demo_scenarios.map((s, i) => (
              <option
                key={s.scenario_id}
                value={source.rental_workflow.rental_requests[i].request_id}
              >
                {s.scenario_id} · {s.scenario_name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Acting staff
          <select value={actor} onChange={(e) => setActor(e.target.value)}>
            {state.dataset.rental_workflow.staff.map((s) => (
              <option key={s.staff_id} value={s.staff_id}>
                {s.name} · {s.role}
              </option>
            ))}
          </select>
        </label>
        <div>
          <small>Demo clock · Pacific time</small>
          <strong>{stamp(now)}</strong>
          <button
            className="secondary"
            onClick={() =>
              setNow(new Date(Date.parse(now) + 4 * 3600000).toISOString())
            }
          >
            Advance four hours
          </button>
        </div>
      </div>
      <div
        role="status"
        aria-live="polite"
        className={message ? "action-message" : "sr-only"}
      >
        {message}
      </div>
      <details className="panel">
        <summary>Find equipment by need, Equipment ID or serial number</summary>
        <label>
          Equipment lookup
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="I need a generator · eq 1001 · serial number"
          />
        </label>
        {search && (
          <>
            <p>{search.message}</p>
            <div className="button-row">
              {search.matches.map((m) => (
                <button
                  className="secondary"
                  key={m.equipment_id}
                  disabled={!isCS}
                  onClick={() => {
                    const asset = state.dataset.equipment.find(
                      (e) => e.equipment_id === m.equipment_id,
                    )!;
                    const revised = {
                      ...request,
                      equipment_type: m.equipment_type,
                      equipment_id: search.exact ? m.equipment_id : undefined,
                      capabilities: asset.capabilities.split("; "),
                      attachments: asset.required_attachments.split("; "),
                      location: m.location,
                    };
                    setEdit(revised);
                    act({
                      type: "Update request",
                      request: revised,
                    } as WorkflowCommand);
                  }}
                >
                  {search.exact ? m.equipment_id : m.equipment_type} ·{" "}
                  {m.location} · confirm request
                </button>
              ))}
            </div>
          </>
        )}
      </details>
      <section className="panel evidence-input">
        <h3>Record a decision</h3>
        <p>
          Every staff action requires a reason and supporting evidence. Choose
          the appropriate sample role above.
        </p>
        <div className="form-grid">
          <label>
            Decision reason
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What was checked or agreed?"
            />
          </label>
          <label>
            Evidence reference
            <input
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Inspection, work or customer acceptance reference"
            />
          </label>
        </div>
      </section>
      <div className="workspace-grid">
        <section className="panel">
          <p className="section-kicker">Rental request</p>
          <h3>{request.equipment_type}</h3>
          <p>
            {stamp(request.pickup)} → {stamp(request.return_at)}
          </p>
          <p>
            {request.location} · {request.daily_hours.toFixed(1)} operating
            hours/day · {request.total_hours} total
          </p>
          <p>
            {request.capabilities.join(" · ")}
            <br />
            Attachments: {request.attachments.join(", ")}
          </p>
          <p>
            <strong>{request.intake.renter_name}</strong>
            {request.intake.company_name && " · " + request.intake.company_name}
            <br />
            {request.intake.primary_contact} · {request.intake.contact}
          </p>
          <p>
            Customer routing: <strong>{customer.route}</strong>.{" "}
            {customer.route === "New"
              ? "Apply the existing new-customer workflow using this shared intake."
              : customer.route === "Uncertain"
                ? "Resolve the match before confirmation."
                : "Confirm the existing customer match."}
          </p>
          <details>
            <summary>Edit shared intake and rental details</summary>
            <div className="form-grid">
              {(
                [
                  "renter_name",
                  "company_name",
                  "billing_contact",
                  "billing_address",
                  "delivery_address",
                  "primary_contact",
                  "contact",
                  "pickup_contact",
                  "return_contact",
                  "responsibilities",
                ] as const
              ).map((key) => (
                <label key={key}>
                  {key.replaceAll("_", " ")}
                  <input
                    value={edit.intake[key]}
                    onChange={(e) => changeIntake(key, e.target.value)}
                  />
                </label>
              ))}
              <label>
                Pickup · ISO timestamp
                <input
                  value={edit.pickup}
                  onChange={(e) => setEdit({ ...edit, pickup: e.target.value })}
                />
              </label>
              <label>
                Return · ISO timestamp
                <input
                  value={edit.return_at}
                  onChange={(e) =>
                    setEdit({ ...edit, return_at: e.target.value })
                  }
                />
              </label>
              <label>
                Daily operating hours
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={edit.daily_hours}
                  onChange={(e) =>
                    setEdit({ ...edit, daily_hours: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Total operating hours
                <input
                  type="number"
                  min="0"
                  value={edit.total_hours}
                  onChange={(e) =>
                    setEdit({ ...edit, total_hours: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                Preparation hours
                <input
                  type="number"
                  min="2"
                  value={edit.preparation_hours}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      preparation_hours: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                Turnaround hours
                <input
                  type="number"
                  min="2"
                  value={edit.turnaround_hours}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      turnaround_hours: Number(e.target.value),
                    })
                  }
                />
              </label>
              <label className="full-width">
                Delivery / pickup notes
                <textarea
                  value={edit.intake.notes}
                  onChange={(e) => changeIntake("notes", e.target.value)}
                />
              </label>
              <label className="full-width">
                Specific usage windows · JSON
                <textarea
                  value={usageText}
                  onChange={(e) => setUsageText(e.target.value)}
                />
              </label>
              <label>
                Site documentation
                <select
                  value={edit.site_documents}
                  onChange={(e) =>
                    setEdit({
                      ...edit,
                      site_documents: e.target
                        .value as RentalRequest["site_documents"],
                    })
                  }
                >
                  {["Verified", "Pending", "Failed"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={edit.logistics_confirmed}
                  onChange={(e) =>
                    setEdit({ ...edit, logistics_confirmed: e.target.checked })
                  }
                />{" "}
                Access and logistics confirmed
              </label>
            </div>
            <button
              disabled={!isCS}
              onClick={() => {
                try {
                  const revised = { ...edit, usage: JSON.parse(usageText) };
                  setEdit(revised);
                  act({
                    type: "Update request",
                    request: revised,
                  } as WorkflowCommand);
                } catch {
                  setMessage(
                    "Usage windows must be valid JSON with start, end and hours.",
                  );
                }
              }}
            >
              Save and reevaluate
            </button>
          </details>
          <details>
            <summary>Billing, insurance and customer checks</summary>
            <p>
              Required checks gate acceptance. Sample verification represents
              the existing process; it does not build registration or insurance
              policy.
            </p>
            <label>
              Customer route
              <select
                value={customer.route}
                disabled={!isCS}
                onChange={(e) =>
                  act({
                    type: "Update customer checks",
                    ...customer,
                    route: e.target.value as typeof customer.route,
                  } as WorkflowCommand)
                }
              >
                {["Existing", "New", "Uncertain"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            {(
              [
                "identity",
                "profile",
                "billing",
                "insurance_on_site",
                "insurance_transport",
              ] as const
            ).map((key) => (
              <label key={key}>
                {key.replaceAll("_", " ")}
                <select
                  disabled={!isCS}
                  value={customer[key]}
                  onChange={(e) =>
                    act({
                      type: "Update customer checks",
                      ...customer,
                      [key]: e.target.value,
                    } as WorkflowCommand)
                  }
                >
                  {["Verified", "Pending", "Failed"].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
            ))}
          </details>
        </section>
        <section className="panel decision-panel">
          <p className="section-kicker">Automatically proposed equipment</p>
          <h3>{matches.proposal?.equipment_id ?? "No qualifying unit"}</h3>
          {result && (
            <>
              <span
                className={"outcome " + (isReady(result) ? "ready" : "blocked")}
              >
                {result.outcome}
              </span>
              <p className="brief-summary">{result.summary}</p>
              <dl className="decision-facts">
                <dt>Current equipment readiness</dt>
                <dd>
                  {result.current.readiness_outcome}
                  {holds.length > 0 && " · " + holds.length + " active hold(s)"}
                </dd>
                <dt>Requested-period forecast</dt>
                <dd>{result.forecast}</dd>
                <dt>Protected interval</dt>
                <dd>
                  {stamp(result.protected_start)} →{" "}
                  {stamp(result.protected_end)}
                </dd>
                <dt>Planning classification</dt>
                <dd>
                  {result.in_time
                    ? "In-time · up to five days before pickup"
                    : "Advance request"}
                </dd>
                <dt>Customer verification</dt>
                <dd>
                  {checks.length
                    ? checks.join("; ")
                    : "Required checks verified"}
                </dd>
                <dt>Agreement</dt>
                <dd>{draft?.status ?? "Not started"}</dd>
              </dl>
              {assigned.map((a) => (
                <p className="allocation-note" key={a.allocation_id}>
                  <strong>
                    {a.equipment_id} · {a.status}
                  </strong>
                  {a.status === "Temporary" &&
                    " · expires " + stamp(a.expires_at)}
                </p>
              ))}
              {result.conditions.length > 0 && (
                <div className="conditions">
                  <strong>Customer-facing conditions</strong>
                  {result.conditions.map((c) => (
                    <p key={c}>{c}</p>
                  ))}
                  <button
                    className="secondary"
                    disabled={!isCS || draft?.status === "Confirmed"}
                    onClick={() =>
                      act({
                        type: "Decline conditions",
                        request_id: requestId,
                      } as WorkflowCommand)
                    }
                  >
                    Record customer decline
                  </button>
                </div>
              )}
              {state.swap_plans
                .filter((p) => p.request_id === requestId)
                .map((p) => (
                  <p key={p.plan_id}>
                    Replacement plan: {p.original_id} → {p.replacement_id} at{" "}
                    {stamp(p.handoff)}. No additional pickup/delivery charge;
                    agreed rental charge applies.
                  </p>
                ))}
              <div className="button-row">
                <button
                  disabled={
                    !isCS ||
                    (!matches.proposal &&
                      !state.swap_plans.some(
                        (p) => p.request_id === requestId,
                      )) ||
                    draft?.status === "Confirmed"
                  }
                  onClick={() =>
                    act({
                      type: "Allocate",
                      request_id: requestId,
                    } as WorkflowCommand)
                  }
                >
                  Protect for four hours
                </button>
                <button
                  className="secondary"
                  disabled={
                    !isCS || !assigned.length || draft?.status === "Confirmed"
                  }
                  onClick={() =>
                    act({
                      type: "Approve proposal",
                      request_id: requestId,
                    } as WorkflowCommand)
                  }
                >
                  Approve proposal
                </button>
                <button
                  disabled={
                    !isCS ||
                    !assigned.length ||
                    checks.length > 0 ||
                    draft?.status === "Confirmed"
                  }
                  onClick={() =>
                    act({
                      type: "Accept",
                      request_id: requestId,
                      accept_conditions: true,
                    } as WorkflowCommand)
                  }
                >
                  Record customer acceptance
                </button>
                <button
                  className="secondary"
                  disabled={!isCS || draft?.status === "Confirmed"}
                  onClick={() =>
                    act({
                      type: "Cancel",
                      request_id: requestId,
                    } as WorkflowCommand)
                  }
                >
                  Cancel draft
                </button>
              </div>
              <p className="scope-note">
                Recording acceptance includes all displayed service/replacement
                conditions. Confirmation rechecks current eligibility, staff
                approval and allocation expiry.
              </p>
              <details>
                <summary>
                  Rule evidence and required human actions (
                  {result.findings.length})
                </summary>
                {result.findings.length === 0 ? (
                  <p>
                    All required equipment controls pass. Customer Service
                    approves the proposal and records customer acceptance.
                  </p>
                ) : (
                  result.findings.map((f, i) => (
                    <div className="finding" key={f.code + i}>
                      <strong>
                        {f.code} · {f.outcome}
                      </strong>
                      <p>{f.message}</p>
                      <small>
                        {f.reference} · {f.evidence}
                      </small>
                      <p>
                        {f.reviewer ?? "Staff detail"}: {f.action}
                      </p>
                    </div>
                  ))
                )}
              </details>
            </>
          )}
        </section>
      </div>

      <section id="mechanic" className="panel">
        <p className="section-kicker">Workspace 02 · scoped resolution</p>
        <h3>Mechanic</h3>
        <p>
          Complete work and certify checks within recorded qualifications. Holds
          stay active until an authorized release passes the rules.
        </p>
        <div className="form-grid">
          <label>
            Maintenance task
            <select
              value={selectedTask?.maintenance_id ?? ""}
              onChange={(e) => setTaskId(e.target.value)}
            >
              {tasks.map((t) => (
                <option key={t.maintenance_id} value={t.maintenance_id}>
                  {t.maintenance_id} · {t.maintenance_type} · {t.status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Active hold
            <select
              value={selectedHold?.hold_id ?? ""}
              onChange={(e) => setHoldId(e.target.value)}
            >
              {holds.map((h) => (
                <option key={h.hold_id} value={h.hold_id}>
                  {h.hold_id} · {h.authority}
                </option>
              ))}
            </select>
          </label>
        </div>
        {selectedTask && (
          <details>
            <summary>Maintenance classification, warranty and policy</summary>
            <pre>
              {JSON.stringify(
                state.dataset.rental_workflow.maintenance_controls.find(
                  (c) => c.maintenance_id === selectedTask.maintenance_id,
                ),
                null,
                2,
              )}
            </pre>
            <p>
              Scheduled: {selectedTask.scheduled_start ?? "Not recorded"} →{" "}
              {selectedTask.scheduled_end ?? "Not recorded"}. Parts:{" "}
              {selectedTask.parts_confirmed ? "Confirmed" : "Pending"};
              technician:{" "}
              {selectedTask.technician_confirmed ? "Confirmed" : "Pending"}.
            </p>
          </details>
        )}
        <div className="button-row">
          <button
            disabled={!isMech || !selectedTask}
            onClick={() =>
              act({
                type: "Complete work",
                maintenance_id: selectedTask!.maintenance_id,
              } as WorkflowCommand)
            }
          >
            Record verified work completion
          </button>
          <button
            disabled={!(isMech || staff.role === "Inspector") || !equipmentId}
            onClick={() =>
              act({
                type: "Pass inspection",
                equipment_id: equipmentId!,
                valid_until: "2026-12-31",
                next_due_hours:
                  (state.dataset.equipment.find(
                    (e) => e.equipment_id === equipmentId,
                  )?.operating_hours ?? 0) + 500,
              } as WorkflowCommand)
            }
          >
            Record passed demo safety checks
          </button>
          <button
            className="secondary"
            disabled={!isManager || !equipmentId}
            onClick={() =>
              act({
                type: "Reconcile",
                equipment_id: equipmentId!,
              } as WorkflowCommand)
            }
          >
            Reconcile conflicting records
          </button>
          <button
            disabled={!selectedHold || !(isMech || isManager)}
            onClick={() =>
              act({
                type: "Release hold",
                hold_id: selectedHold!.hold_id,
              } as WorkflowCommand)
            }
          >
            Release selected hold
          </button>
          <button
            className="secondary"
            disabled={!(isMech || isManager) || !equipmentId}
            onClick={() =>
              act({
                type: "Place hold",
                equipment_id: equipmentId!,
                task_id: selectedTask?.maintenance_id ?? "Safety concern",
                authority: isManager ? "Manager" : "Mechanic",
              } as WorkflowCommand)
            }
          >
            Place operational hold
          </button>
        </div>
        <p className="scope-note">
          The safety-check button records a fictional completed inspection with
          demo validity through Dec 31 and a 500-hour future limit. Required
          repair must be complete first; it never releases a hold.
        </p>
        <details>
          <summary>Service schedule and permitted delay</summary>
          <div className="form-grid">
            <label>
              Service start · ISO timestamp
              <input
                value={planStart}
                onChange={(e) => setPlanStart(e.target.value)}
              />
            </label>
            <label>
              Service end · ISO timestamp
              <input
                value={planEnd}
                onChange={(e) => setPlanEnd(e.target.value)}
              />
            </label>
          </div>
          <button
            disabled={!isMech || !selectedTask}
            onClick={() =>
              act({
                type: "Record service plan",
                plan: {
                  plan_id: "PLAN-" + requestId,
                  request_id: requestId,
                  equipment_id: equipmentId!,
                  maintenance_id: selectedTask!.maintenance_id,
                  start: planStart,
                  end: planEnd,
                  confirmed: true,
                  logistics_confirmed: true,
                  evidence,
                  instructions: reason,
                },
              } as WorkflowCommand)
            }
          >
            Record confirmed service plan
          </button>
          <p>
            Parts, technician, site capability, access and usage timing must
            still satisfy the rules. A plan never records completion.
          </p>
          <div className="form-grid">
            <label>
              Deferred service · ISO timestamp
              <input
                value={serviceAt}
                onChange={(e) => setServiceAt(e.target.value)}
              />
            </label>
            <label>
              Projected meter at service
              <input
                type="number"
                value={serviceMeter}
                onChange={(e) => setServiceMeter(Number(e.target.value))}
              />
            </label>
          </div>
          <button
            disabled={!isManager || !selectedTask}
            onClick={() =>
              act({
                type: "Approve delay",
                request_id: requestId,
                maintenance_id: selectedTask!.maintenance_id,
                service_at: serviceAt,
                service_meter: serviceMeter,
              } as WorkflowCommand)
            }
          >
            Approve compliant noncritical delay
          </button>
          <p>
            Fictional allowance: seven calendar days or 25 operating hours,
            whichever comes first. Warranty/task limits take precedence.
          </p>
        </details>
        <details>
          <summary>Confirmed replacement plan</summary>
          <p>
            Both units must qualify for their rental segments. Usage windows and
            confirmed transport evidence are required.
          </p>
          <div className="form-grid">
            <label>
              Replacement unit
              <select
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
              >
                <option value="">Choose unit</option>
                {state.dataset.equipment
                  .filter(
                    (e) =>
                      e.equipment_id !== equipmentId &&
                      e.equipment_type === request.equipment_type,
                  )
                  .map((e) => (
                    <option key={e.equipment_id}>{e.equipment_id}</option>
                  ))}
              </select>
            </label>
            <label>
              Delivery, handoff and collection · ISO timestamp
              <input
                value={swapAt}
                onChange={(e) => setSwapAt(e.target.value)}
              />
            </label>
            <label>
              Original segment operating hours
              <input
                type="number"
                value={originalHours}
                onChange={(e) => setOriginalHours(Number(e.target.value))}
              />
            </label>
          </div>
          <button
            disabled={!isManager || !replacement}
            onClick={() => {
              const plan: SwapPlan = {
                plan_id: "SWAP-" + requestId,
                request_id: requestId,
                original_id: equipmentId!,
                replacement_id: replacement,
                handoff: swapAt,
                delivery_at: swapAt,
                collection_at: swapAt,
                downtime_hours: 0,
                original_hours: originalHours,
                replacement_hours: request.total_hours - originalHours,
                confirmed: true,
                evidence,
                instructions: reason,
                approved_by: actor,
                request_scope: requestScope(request),
              };
              act({ type: "Record swap", plan } as WorkflowCommand);
            }}
          >
            Approve confirmed demo swap
          </button>
        </details>
      </section>
      <section className="panel">
        <h3>Callback and review</h3>
        <p>
          Promise an update after review. Equipment remains blocked until
          required work and authorized release are recorded.
        </p>
        <div className="form-grid">
          <label>
            Agreed update time · ISO timestamp
            <input
              value={callbackAt}
              onChange={(e) => setCallbackAt(e.target.value)}
            />
          </label>
          <label>
            Pending question / review result / customer update
            <input
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </label>
        </div>
        <button
          disabled={!isCS || !!matches.proposal || !equipmentId}
          onClick={() =>
            act({
              type: "Callback",
              request_id: requestId,
              equipment_id: equipmentId!,
              update_at: callbackAt,
              question: reviewText,
            } as WorkflowCommand)
          }
        >
          Record callback
        </button>
        <label>
          Review disposition
          <select
            value={reviewStatus}
            onChange={(e) =>
              setReviewStatus(e.target.value as typeof reviewStatus)
            }
          >
            {["Incomplete", "Confirmed plan", "Denied", "Complete"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        {callbacks.map((c) => (
          <div className="finding" key={c.callback_id}>
            <strong>
              {c.callback_id} · {c.status} · {stamp(c.update_at)}
            </strong>
            <p>
              {c.contact} · Owner {c.owner} · Reviewer {c.reviewer}
            </p>
            <p>
              {c.question} · Review: {c.review_status} · {c.review_result}
            </p>
            {c.status === "Open" &&
              Date.parse(now) >= Date.parse(c.update_at) && (
                <p className="allocation-note">
                  Customer update is due, even if review is unfinished.
                </p>
              )}
            <p>{c.customer_update}</p>
            <div className="button-row">
              <button
                disabled={c.status !== "Open" || staff.role !== c.reviewer}
                onClick={() =>
                  act({
                    type: "Review callback",
                    callback_id: c.callback_id,
                    result: reviewText,
                    review_status: reviewStatus,
                  } as WorkflowCommand)
                }
              >
                Record review result
              </button>
              <button
                disabled={c.status !== "Open" || !isCS}
                onClick={() =>
                  act({
                    type: "Record customer update",
                    callback_id: c.callback_id,
                    result: reviewText,
                  } as WorkflowCommand)
                }
              >
                Record customer update and close
              </button>
            </div>
          </div>
        ))}
      </section>
      <details className="panel">
        <summary>Decision history ({state.decisions.length})</summary>
        {state.decisions.length === 0 ? (
          <p>No decisions recorded.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Time / actor</th>
                  <th>Action / reference</th>
                  <th>Reason / evidence</th>
                </tr>
              </thead>
              <tbody>
                {state.decisions.toReversed().map((d) => (
                  <tr key={d.decision_id}>
                    <td>
                      {stamp(d.timestamp)}
                      <br />
                      {d.actor}
                    </td>
                    <td>
                      {d.action}
                      <br />
                      {d.equipment_id} · {d.reference}
                    </td>
                    <td>
                      {d.reason}
                      <br />
                      {d.evidence}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
      <details className="panel">
        <summary>All matching equipment and allocation history</summary>
        {matches.results.map((r) => (
          <p key={r.equipment_id}>
            {r.equipment_id} · {r.outcome} · {r.forecast}
          </p>
        ))}
        {state.allocations
          .filter((a) => a.request_id === requestId)
          .map((a) => (
            <p key={a.allocation_id}>
              {a.allocation_id} · {a.equipment_id} · {a.status} · created{" "}
              {stamp(a.created_at)} · expiry {stamp(a.expires_at)}
            </p>
          ))}
      </details>
    </section>
  );
}
