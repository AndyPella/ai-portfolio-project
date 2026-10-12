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
// Format display text only; preserve canonical timestamps in approval scopes.
const readableTimes = (value: string) =>
  value.replace(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})/g,
    (timestamp) => `${stamp(timestamp)} Pacific`,
  );
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
  type View = "customer" | "equipment" | "agreement" | "resolution";
  const [view, setView] = useState<View>("equipment");
  const [startedRequests, setStartedRequests] = useState<string[]>([]);
  const [pending, setPending] = useState<Omit<WorkflowCommand, "actor" | "reason" | "evidence"> | null>(null);
  const [query, setQuery] = useState("");
  const [lookupId, setLookupId] = useState("");
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
    request.equipment_id ??
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
  const perform = (
    command: Omit<WorkflowCommand, "actor" | "reason" | "evidence">,
    routineRecord?: { reason: string; evidence: string },
  ) => {
    try {
      const next = applyWorkflow(
        state,
        { ...command, actor, reason, evidence, ...routineRecord } as WorkflowCommand,
        now,
      );
      setState(next);
      if (command.type === "Allocate" && !startedRequests.includes(requestId)) {
        setStartedRequests(ids => [...ids, requestId]);
        setView("customer");
      }
      setMessage(command.type + " recorded. Eligibility has been reevaluated.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Action could not be completed.",
      );
    }
  };
  const act = (command: Omit<WorkflowCommand, "actor" | "reason" | "evidence">) => setPending(command);
  const advanceRoutine = (command: Omit<WorkflowCommand, "actor" | "reason" | "evidence">, action: string) => perform(command, {
    reason: `Routine UI action: ${action}. No staff verification was requested.`,
    evidence: `UI request ${requestId} at ${now}; recorded interaction, not inspection or approval evidence.`,
  });
  useEffect(() => {
    const selectEntry = () => {
      if (window.location.hash === "#mechanic") { setActor("DEMO-MECH"); setView("resolution"); }
      if (window.location.hash === "#customer-service") { setActor("DEMO-CS"); setView("equipment"); }
    };
    selectEntry();
    window.addEventListener("hashchange", selectEntry);
    return () => window.removeEventListener("hashchange", selectEntry);
  }, []);
  useEffect(() => {
    if (!pending) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setPending(null); return; }
      if (event.key !== "Tab") return;
      const controls = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"] input, [role="dialog"] button:not(:disabled)'));
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [pending]);
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
    setView("equipment");
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
    setQuery("");
    setLookupId("");
  };
  const isCS = staff.role === "Customer Service",
    isMech = staff.role === "Mechanic",
    isManager = staff.role === "Manager";
  const canCustomer = isCS || isManager;
  const canResolve = isMech || isManager || staff.role === "Inspector";
  const rentalStarted = startedRequests.includes(requestId);
  const visibleViews: View[] = canCustomer ? ["equipment", "customer", "agreement", "resolution"] : ["equipment", "resolution"];
  const currentView = visibleViews.includes(view) ? view : "equipment";
  const titles: Record<View, string> = { customer: "2 · Customer identification", equipment: "1 · Equipment availability", agreement: "3 · Rental agreement", resolution: "Review & resolution" };
  const guidance: Record<View, string> = {
    customer: "Identify an existing customer or follow the assumed new-customer process. Complete customer details and required checks using the shared rental information.",
    equipment: "Start with equipment needs, requested dates and expected use. Review availability, blockers and conditions. An availability-only inquiry does not require a customer profile or allocation.",
    agreement: "Review required checks and conditions, protect the equipment, approve the proposal, then record customer acceptance.",
    resolution: canResolve ? "Record qualified inspections or maintenance evidence and review holds. Work completion and hold release are separate actions." : "Arrange an owned callback when qualified review is needed. Maintenance findings remain visible in Equipment & readiness."
  };
  const nextStep = draft?.status === "Confirmed" ? "Rental confirmed. Review the recorded agreement and any continuing conditions."
    : result && !isReady(result) ? canResolve ? "Review the blocker and record the qualified resolution evidence." : "Review the blocker. Request qualified resolution or arrange a callback."
    : !rentalStarted ? "Finish the availability inquiry here, or choose to rent and temporarily protect the equipment before customer identification."
    : checks.length ? "Complete the required customer checks before acceptance."
    : !assigned.length || assigned.some(a => a.scope !== requestScope(request)) ? "Protect the selected equipment for four hours."
    : !draft?.approved_scope ? "Review the proposal and record staff approval."
    : "Review customer acceptance, including all displayed conditions, before confirming.";
  const openExample = (id: string) => { choose(id); setActor("DEMO-CS"); setView("equipment"); setPending(null); };
  const changeIntake = (key: keyof RentalRequest["intake"], value: string) =>
    setEdit({ ...edit, intake: { ...edit.intake, [key]: value } });
  const confirmEquipment = (id: string, exact: boolean) => {
    const asset = state.dataset.equipment.find((e) => e.equipment_id === id)!;
    const revised = {
      ...request,
      equipment_type: asset.equipment_type,
      equipment_id: exact ? asset.equipment_id : undefined,
      capabilities: asset.capabilities.split("; "),
      attachments: asset.required_attachments.split("; "),
      location: asset.current_location,
    };
    setEdit(revised);
    act({ type: "Update request", request: revised } as WorkflowCommand);
  };
  return (
    <section
      id="customer-service"
      className="rental-workspace"
      aria-labelledby="workspace-title"
    >
      <div className="workspace-heading">
        <div>
          <p className="section-kicker">Workspace 01</p>
          <h2 id="workspace-title">Rental workspace</h2>
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
      <details className="panel walkthrough" id="guided-walkthrough">
        <summary>Explore a sample rental</summary>
        <p>Load a sample request and its proposed equipment, then use the workspace sections below. Begin with availability. Proceed to rent only when the customer wants a rental, then identify an existing or new customer. Switching examples retains session changes; reload restores the original data.</p>
        <div className="button-row">
          <button className="secondary" onClick={() => openExample("REQ-SCN-001")}>1 · Ready to rent</button>
          <button className="secondary" onClick={() => openExample("REQ-SCN-002")}>2 · Blocked rental</button>
          <button className="secondary" onClick={() => openExample("REQ-SCN-004")}>3 · Ready with conditions</button>
        </div>
        <p>Ready: EQ-1001, September 8–12. Blocked: EQ-1002, September 8–10, requiring inspection and separate hold release. Conditions: EQ-1004, September 10–20, with service September 15, 10 AM–noon Pacific.</p>
      </details>
      <div className="workspace-toolbar" inert={pending ? true : undefined}>
        <label>
          Demo request
          <select value={requestId} onChange={(e) => { choose(e.target.value); setPending(null); }}>
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
          <select value={actor} onChange={(e) => { setActor(e.target.value); setPending(null); setView(e.target.value === "DEMO-CS" ? "equipment" : "resolution"); }}>
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
      <div className="rental-context" aria-label="Current rental summary">
        <div><small>Customer</small><strong>{rentalStarted || isManager ? request.intake.renter_name : "Availability inquiry · not required yet"}</strong></div>
        <div><small>Rental dates · Pacific</small><strong>{stamp(request.pickup)} → {stamp(request.return_at)}</strong></div>
        <div><small>Selected equipment</small><strong>{equipmentId ?? "No unit selected"} · {request.equipment_type}</strong></div>
        <div><small>Current status</small><strong>{draft?.status === "Confirmed" ? "Confirmed" : result?.outcome ?? "Needs review"}</strong></div>
      </div>
      <nav className="workspace-navigation" aria-label="Rental functions">
        {visibleViews.map(id => <button key={id} disabled={!rentalStarted && !isManager && (id === "customer" || id === "agreement")} className={currentView === id ? "" : "secondary"} aria-current={currentView === id ? "page" : undefined} onClick={() => setView(id)}>{titles[id]}</button>)}
      </nav>
      <div className="section-guidance">
        <h3>{titles[currentView]}</h3><p>{guidance[currentView]}</p>
        <p><strong>Next action:</strong> {nextStep}</p>
        {currentView === "customer" && <button onClick={() => setView("agreement")}>Continue to rental agreement</button>}
        {currentView === "equipment" && canCustomer && !rentalStarted && <>
          <div className="button-row">
            <button disabled={!isCS || !matches.proposal} onClick={() => advanceRoutine({ type: "Allocate", request_id: requestId } as WorkflowCommand, "Proceed to rent")}>Proceed to rent · protect equipment</button>
            <button className="secondary" onClick={() => setMessage("Availability inquiry complete. No equipment was allocated and no customer profile was required.")}>Finish availability check</button>
          </div>
          <p className="scope-note">Proceeding protects the equipment for up to four hours while existing/new customer identification is completed. Expiry releases temporary protection; early release is outside the lightweight demo scope.</p>
        </>}
        {currentView === "equipment" && canCustomer && rentalStarted && result && isReady(result) && <button onClick={() => setView("agreement")}>Prepare rental agreement</button>}
        {currentView === "equipment" && result && !isReady(result) && <button onClick={() => setView("resolution")}>Review resolution options</button>}
        {currentView === "resolution" && <button className="secondary" onClick={() => setView("equipment")}>Return to readiness</button>}
      </div>
      <section className="panel" hidden={currentView !== "equipment" || !canCustomer}>
        <h3>Equipment needs and rental period</h3>
        <p>{request.equipment_type} · {request.location}. Use the equipment list or search below to change the requested equipment. Dates and usage determine the readiness result.</p>
        <div className="form-grid">
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
        </div>
        <button disabled={!isCS || draft?.status === "Confirmed"} onClick={() => advanceRoutine({ type: "Update request", request: { ...request, pickup: edit.pickup, return_at: edit.return_at, daily_hours: edit.daily_hours, total_hours: edit.total_hours } } as WorkflowCommand, "Check requested availability")}>Check requested availability</button>
      </section>
      <details className="panel" hidden={currentView !== "equipment" || !canCustomer}>
        <summary>Change equipment · search or equipment list</summary>
        <label>
          Equipment lookup
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="I need a generator · eq 1001 · serial number"
          />
        </label>
        <label>
          Equipment list
          <select aria-label="Equipment list" value={lookupId} onChange={(e) => setLookupId(e.target.value)} disabled={!isCS || draft?.status === "Confirmed"}>
            <option value="">Choose a recorded unit</option>
            {state.dataset.equipment.map((asset) => <option key={asset.equipment_id} value={asset.equipment_id}>{asset.equipment_id} · {asset.equipment_type} · {asset.serial_number} · {asset.current_location}</option>)}
          </select>
        </label>
        <button className="secondary" disabled={!isCS || !lookupId || draft?.status === "Confirmed"} onClick={() => confirmEquipment(lookupId, true)}>Confirm selected equipment</button>
        <p className="scope-note">Search or select a unit, then confirm to apply it to the current request. Dates and customer information are retained; inspect the updated requirements before approval.</p>
        {search && (
          <>
            <p>{search.message}</p>
            <div className="button-row">
              {search.matches.map((m) => (
                <button
                  className="secondary"
                  key={m.equipment_id}
                  disabled={!isCS || draft?.status === "Confirmed"}
                  onClick={() => confirmEquipment(m.equipment_id, search.exact)}
                >
                  {search.exact ? m.equipment_id : m.equipment_type} ·{" "}
                  {m.location} · confirm request
                </button>
              ))}
            </div>
          </>
        )}
      </details>
      {pending && <div className="decision-dialog-backdrop">
        <section role="dialog" aria-modal="true" aria-labelledby="decision-title" className="panel decision-dialog">
          <h3 id="decision-title">Record evidence · {pending.type}</h3>
          <p>Acting as {staff.name} · {staff.role}. Record why this action is appropriate and its supporting evidence. Sample references are sufficient for this fictional demo.</p>
          <label>Decision reason<input autoFocus value={reason} onChange={e => setReason(e.target.value)} /></label>
          <label>Evidence reference<input value={evidence} onChange={e => setEvidence(e.target.value)} /></label>
          <div className="button-row"><button disabled={!reason.trim() || !evidence.trim()} onClick={() => { perform(pending); setPending(null); }}>Confirm action</button><button className="secondary" onClick={() => setPending(null)}>Back without recording</button></div>
        </section>
      </div>}
      <div className="workspace-grid workspace-sections">
        <section className="panel" hidden={!canCustomer || (currentView !== "customer" && currentView !== "agreement")}>
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
            <label>
              Customer route
              <select
                value={customer.route}
                disabled={!isCS}
                onChange={(e) =>
                  advanceRoutine({
                    type: "Update customer checks",
                    ...customer,
                    route: e.target.value as typeof customer.route,
                  } as WorkflowCommand, "Select customer type")
                }
              >
                {["Existing", "New", "Uncertain"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          <p className="scope-note">Existing uses the sample customer match. New represents the assumed working registration process; this demo records its checks rather than building a customer registration system.</p>
          <p>
            Customer routing: <strong>{customer.route}</strong>.{" "}
            {customer.route === "New"
              ? "Apply the existing new-customer workflow using this shared intake."
              : customer.route === "Uncertain"
                ? "Resolve the match before confirmation."
                : "Confirm the existing customer match."}
          </p>
          <details hidden={currentView !== "customer"}>
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
          <details open>
            <summary>Billing, insurance and customer checks</summary>
            <p>
              Required checks gate acceptance. Sample verification represents
              the existing process; it does not build registration or insurance
              policy.
            </p>
            {(
              [
                "identity",
                "profile",
                "billing",
                "insurance_on_site",
                "insurance_transport",
              ] as const
            ).map((key) => (
              <div className="verification-item" key={key}>
                <label>
                <input type="checkbox"
                  aria-label={{ identity: "Identity verified", profile: "Customer profile verified", billing: "Billing verified", insurance_on_site: "On-site insurance verified", insurance_transport: "Transport insurance verified" }[key]}
                  disabled={!isCS}
                  checked={customer[key] === "Verified"}
                  onChange={(e) =>
                    act({
                      type: "Update customer checks",
                      ...customer,
                      [key]: e.target.checked ? "Verified" : "Pending",
                    } as WorkflowCommand)
                  }
                />{" "}
                {{ identity: "Identity", profile: "Customer profile", billing: "Billing", insurance_on_site: "On-site insurance", insurance_transport: "Transport insurance" }[key]} · Verified
                </label>
                {key === "billing" && <p>Billing address: {request.intake.billing_address || "Not provided"}</p>}
                {key === "insurance_on_site" && <p>Insurance company: {customer.insurance_on_site_company || "Not provided"}</p>}
                {key === "insurance_transport" && <p>Insurance company: {customer.insurance_transport_company || "Not provided"}</p>}
                {customer[key] !== "Verified" && <p className="scope-note">Current status: {customer[key]}. Rental acceptance requires verification.</p>}
              </div>
            ))}
          </details>
        </section>
        <section className="panel decision-panel" hidden={currentView !== "equipment" && currentView !== "agreement"}>
          <p className="section-kicker">Selected equipment</p>
          <h3>{equipmentId ?? "No unit selected"}</h3>
          {result && (
            <>
              <span
                className={"outcome " + (isReady(result) ? "ready" : "blocked")}
              >
                {result.outcome}
              </span>
              <p className="brief-summary">
                {draft?.status === "Confirmed" && isReady(result)
                  ? result.conditions.length > 0
                    ? "Rental confirmed. Required service/replacement conditions have been accepted."
                    : "Rental confirmed for your requested dates."
                  : readableTimes(result.summary)}
              </p>
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
                <dt hidden={!canCustomer || !rentalStarted}>Customer verification</dt>
                <dd hidden={!canCustomer || !rentalStarted}>
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
                    <p key={c}>{readableTimes(c)}</p>
                  ))}
                  <button
                    hidden={!canCustomer || currentView !== "agreement"}
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
              <div className="button-row" hidden={!canCustomer || currentView !== "agreement"}>
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
                    !draft?.approved_scope ||
                    assigned.some((a) => a.scope !== draft.approved_scope) ||
                    !isReady(result) ||
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
                      <p>{readableTimes(f.message)}</p>
                      <small>
                        {f.reference} · {f.evidence}
                      </small>
                      <p>
                        {f.reviewer ?? "Staff detail"}:{" "}
                        {draft?.status === "Confirmed" &&
                        isReady(result) &&
                        f.code === "SERVICE_STOP"
                          ? "Customer acceptance recorded. Required service stop remains in force."
                          : readableTimes(f.action)}
                      </p>
                    </div>
                  ))
                )}
              </details>
            </>
          )}
        </section>
      </div>

      <section id="mechanic" className="panel" hidden={currentView !== "resolution" || !canResolve}>
        <p className="section-kicker">Maintenance & holds</p>
        <h3>Equipment resolution</h3>
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
            hidden={!(isMech || isManager)}
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
            hidden={!canResolve}
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
            hidden={!isManager}
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
            hidden={!(isMech || isManager)}
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
            hidden={!(isMech || isManager)}
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
            hidden={!(isMech || isManager)}
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
            <label hidden={!isManager}>
              Deferred service · ISO timestamp
              <input
                value={serviceAt}
                onChange={(e) => setServiceAt(e.target.value)}
              />
            </label>
            <label hidden={!isManager}>
              Projected meter at service
              <input
                type="number"
                value={serviceMeter}
                onChange={(e) => setServiceMeter(Number(e.target.value))}
              />
            </label>
          </div>
          <button
            hidden={!isManager}
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
        <details hidden={!isManager}>
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
      <section className="panel" hidden={currentView !== "resolution"}>
        <h3>Callback and review</h3>
        <p>
          Promise an update after review. Equipment remains blocked until
          required work and authorized release are recorded.
        </p>
        <div className="form-grid">
          <label hidden={!canCustomer}>
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
          hidden={!canCustomer}
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
        <label hidden={!canResolve}>
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
                hidden={!canResolve}
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
                hidden={!canCustomer}
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
      <details className="panel" hidden={currentView !== "resolution" && currentView !== "agreement"}>
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
      <details className="panel" hidden={currentView !== "equipment" && currentView !== "agreement"}>
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
