"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
const pacificInput = (value: string) => {
  if (!value || !Number.isFinite(Date.parse(value))) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(value));
  const part = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
};
const fromPacificInput = (value: string) => {
  if (!value) return "";
  const wall = Date.parse(value + ":00Z");
  if (!Number.isFinite(wall)) return "";
  let instant = wall;
  for (let i = 0; i < 3; i++) instant = wall - (Date.parse(pacificInput(new Date(instant).toISOString()) + ":00Z") - instant);
  const offset = Math.round((wall - instant) / 60000);
  const sign = offset < 0 ? "-" : "+";
  const minutes = Math.abs(offset);
  return `${value}:00${sign}${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
};
function ProductIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    mountain: "M2 20 9 6l4 7 3-5 6 12H2Zm5 0 6-11 6 11",
    calendar: "M5 5h14v16H5V5Zm0 5h14M8 2v6m8-6v6",
    equipment: "M3 17h12v3H3v-3Zm2 0v-6h6v6m-2-6V7h4l4 6h4v4h-4l-5-5M2 21h15",
    users: "M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-6 9v-3a6 6 0 0 1 12 0v3M17 5a3 3 0 0 1 0 6m0 4a5 5 0 0 1 5 5",
    service: "m5 20 10-10M14 3a5 5 0 0 0 6 7l-3-3 3-3-1-1M5 16l3 3",
    document: "M5 3h10l4 4v14H5V3Zm10 0v5h4M8 12h8m-8 4h8",
    clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-16v6l4 2",
    shield: "m12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6l8-4Zm-4 10 3 3 5-6"
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name] ?? paths.document} /></svg>;
}

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
  const [findingsOpen, setFindingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pending, setPending] = useState<Omit<WorkflowCommand, "actor" | "reason" | "evidence"> | null>(null);
  const [query, setQuery] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [customerExpanded, setCustomerExpanded] = useState(false);
  const [agreementExpanded, setAgreementExpanded] = useState(false);
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
        setCustomerExpanded(true);
        requestAnimationFrame(() => document.getElementById("product-customer")?.scrollIntoView({ behavior: "smooth", block: "start" }));
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
    setFindingsOpen(false);
    setCustomerExpanded(false);
    setAgreementExpanded(false);
    setCustomerQuery("");
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
  const blockingReasons = result && !isReady(result)
    ? [...new Set(result.findings.filter(f => f.outcome !== "Rental Ready" && f.outcome !== "Rental Ready with Conditions").map(f => readableTimes(f.message)))]
    : [];
  const reviewBlockers = () => {
    setView("equipment");
    setFindingsOpen(true);
    requestAnimationFrame(() => {
      const findings = document.getElementById("readiness-findings");
      if (!findings) return;
      const headerHeight = 85;
      window.scrollTo({ top: findings.getBoundingClientRect().top + window.scrollY - headerHeight - 20, behavior: "smooth" });
    });
  };
  const visibleViews: View[] = canCustomer ? ["equipment", "customer", "agreement", "resolution"] : ["equipment", "resolution"];
  const currentView = visibleViews.includes(view) ? view : "equipment";
  const titles: Record<View, string> = { customer: "2 · Customer identification", equipment: "1 · Equipment availability", agreement: "3 · Rental agreement", resolution: "Review & resolution" };
  const nextStep = draft?.status === "Confirmed" ? "Rental confirmed. Review the recorded agreement and any continuing conditions."
    : result && !isReady(result) ? canResolve ? "Review the blocker and record the qualified resolution evidence." : "Review the blocker. Request qualified resolution or arrange a callback."
    : !rentalStarted ? "Finish the availability inquiry here, or choose to rent and temporarily protect the equipment before customer identification."
    : checks.length ? "Complete the required customer checks before acceptance."
    : !assigned.length || assigned.some(a => JSON.stringify(JSON.parse(a.scope).request) !== requestScope(request)) ? "Protect the selected equipment for four hours."
    : !draft?.approved_scope ? "Review the proposal and record staff approval."
    : "Review customer acceptance, including all displayed conditions, before confirming.";
  const openExample = (id: string) => { choose(id); setActor("DEMO-CS"); setView("equipment"); setPending(null); };
  const changeIntake = (key: keyof RentalRequest["intake"], value: string) =>
    setEdit({ ...edit, intake: { ...edit.intake, [key]: value } });
  const confirmEquipment = (id: string, exact: boolean) => {
    const asset = state.dataset.equipment.find((e) => e.equipment_id === id)!;
    const revised = {
      ...edit,
      equipment_type: asset.equipment_type,
      equipment_id: exact ? asset.equipment_id : undefined,
      capabilities: asset.capabilities.split("; "),
      attachments: asset.required_attachments.split("; "),
      location: asset.current_location,
    };
    setEdit(revised);
    advanceRoutine({ type: "Update request", request: revised } as WorkflowCommand, "Select equipment");
  };
  const updateUsage = (index: number, window: RentalRequest["usage"][number]) => {
    const usage = edit.usage.map((old, i) => i === index ? window : old);
    setEdit({ ...edit, usage }); setUsageText(JSON.stringify(usage));
  };
  const availabilityChanged = edit.pickup !== request.pickup || edit.return_at !== request.return_at || edit.daily_hours !== request.daily_hours || edit.total_hours !== request.total_hours;
  const intakeChanged = JSON.stringify(edit.intake) !== JSON.stringify(request.intake) || edit.site_documents !== request.site_documents || edit.logistics_confirmed !== request.logistics_confirmed || usageText !== JSON.stringify(request.usage);
  const selectedAsset = state.dataset.equipment.find(e => e.equipment_id === equipmentId);
  const navigate = (section: View) => {
    setView(section);
    if (section === "customer") setCustomerExpanded(true);
    if (section === "agreement") setAgreementExpanded(true);
    requestAnimationFrame(() => document.getElementById(`product-${section}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };
  const customerOptions = [...new Map(state.dataset.rental_workflow.rental_requests.map(r => [r.customer_id, r])).values()].filter(r => `${r.intake.renter_name} ${r.intake.company_name} ${r.intake.contact}`.toLowerCase().includes(customerQuery.toLowerCase()));
  const chooseCustomer = (candidate: RentalRequest) => {
    const revised = { ...request, customer_id: candidate.customer_id, intake: { ...candidate.intake, notes: edit.intake.notes } };
    setEdit(revised);
    advanceRoutine({ type: "Update request", request: revised } as WorkflowCommand, "Select existing customer");
    setCustomerQuery("");
  };
  return (
    <section id="customer-service" className="rental-workspace product-workspace" aria-labelledby="workspace-title">
      <aside className="product-sidebar">
        <Link href="/" className="product-brand"><ProductIcon name="mountain" /><span>NORTHSTAR<br />RIDGE<small>EQUIPMENT GROUP</small></span></Link>
        <nav aria-label="Workspace navigation">
          <button className={currentView !== "resolution" ? "active" : ""} onClick={() => navigate("equipment")}><ProductIcon name="calendar" />Rental workspace</button>
          <button onClick={() => navigate("equipment")}><ProductIcon name="equipment" />Equipment</button>
          {canCustomer && <button disabled={!rentalStarted && !isManager} onClick={() => navigate("customer")}><ProductIcon name="users" />Customers</button>}
          <button className={currentView === "resolution" ? "active" : ""} onClick={() => navigate("resolution")}><ProductIcon name="service" />Service & review</button>
          <button onClick={() => { setHistoryOpen(true); requestAnimationFrame(() => document.getElementById("product-activity")?.scrollIntoView({ behavior: "smooth", block: "start" })); }}><ProductIcon name="document" />Activity</button>
          <a href="/project/requirements" target="_blank" rel="noopener noreferrer"><ProductIcon name="document" />Project background ↗</a>
        </nav>
        <div className="sidebar-footer"><span>Fictional demo · v0.1.0</span><small>Changes reset on reload</small></div>
      </aside>
      <div className="product-body">
        <header className="product-header"><p>Rentals <span>/</span> New inquiry</p>        <label>
          Working as
          <select value={actor} onChange={(e) => { setActor(e.target.value); setPending(null); setView(e.target.value === "DEMO-CS" ? "equipment" : "resolution"); }}>
            {state.dataset.rental_workflow.staff.map((s) => (
              <option key={s.staff_id} value={s.staff_id}>
                {s.role}
              </option>
            ))}
          </select>
        </label>
<span className="staff-avatar" aria-hidden="true">NR</span></header>
        <div className="product-content">
          <div className="product-title"><div><h1 id="workspace-title">New rental inquiry</h1><p>Check availability, identify the customer, and prepare the agreement.</p></div><span className="concept-label">Fictional demo</span></div>
          <div role="status" aria-live="polite" className={message ? "action-message" : "sr-only"}>{message}</div>
          <div className="product-columns">
            <main className="product-flow">
              <nav className="workspace-navigation product-progress" aria-label="Rental functions">
                {visibleViews.map((id, i) => <button key={id} disabled={!rentalStarted && !isManager && (id === "customer" || id === "agreement")} aria-current={currentView === id ? "step" : undefined} className={currentView === id ? "active" : ""} onClick={() => navigate(id)}><span>{id === "resolution" ? "↗" : i + 1}</span>{titles[id].replace(/^\d · /, "")}</button>)}
              </nav>
              <div id="product-equipment">
      <section className="panel" hidden={!canCustomer}>
        <h3>Equipment & dates</h3>
        <p className="form-help">Availability includes safety checks, maintenance, operating hours, and booking conflicts.</p>
        <div className="availability-form">
          <label>Equipment
            <select aria-label="Equipment list" value={lookupId || equipmentId || ""} disabled={!isCS || draft?.status === "Confirmed"} onChange={e => { setLookupId(e.target.value); confirmEquipment(e.target.value, true); }}>
              {state.dataset.equipment.map(e => <option key={e.equipment_id} value={e.equipment_id}>{e.equipment_type} · {e.equipment_id}</option>)}
            </select>
          </label>
              <label>
                Pickup · Pacific
                <input
                  type="datetime-local" value={pacificInput(edit.pickup)}
                  onInput={e => setEdit({ ...edit, pickup: fromPacificInput(e.currentTarget.value) })}
                  onChange={(e) => setEdit({ ...edit, pickup: fromPacificInput(e.target.value) })}
                />
              </label>
              <label>
                Return · Pacific
                <input
                  type="datetime-local" value={pacificInput(edit.return_at)}
                  onInput={e => setEdit({ ...edit, return_at: fromPacificInput(e.currentTarget.value) })}
                  onChange={(e) =>
                    setEdit({ ...edit, return_at: fromPacificInput(e.target.value) })
                  }
                />
              </label>
              <label>
                Hours / day
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
                Total hours
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

              <div className="equipment-list-heading"><h2>Equipment availability</h2><small>{matches.results.length} matching unit{matches.results.length === 1 ? "" : "s"}</small></div>
              <div className="equipment-results">
                {matches.results.map(r => {
                  const asset = state.dataset.equipment.find(e => e.equipment_id === r.equipment_id)!;
                  const selected = r.equipment_id === equipmentId;
                  return <button key={r.equipment_id} className={`equipment-result ${selected ? "selected" : ""}`} aria-pressed={selected} disabled={!isCS || draft?.status === "Confirmed"} onClick={() => { if (!selected) confirmEquipment(r.equipment_id, true); }}>
                    <ProductIcon name="equipment" /><span className="asset-description"><strong>{asset.equipment_id} · {asset.equipment_type}</strong><small>{asset.manufacturer} {asset.model} · {asset.current_location}</small></span>
                    <span className="asset-readiness"><span className={`outcome ${isReady(r) ? "ready" : "blocked"}`}>{r.outcome.replace("Rental Ready", "Ready to rent")}</span><small>{draft?.status === "Confirmed" && selected && isReady(r) ? "Rental confirmed. Accepted conditions remain in force." : isReady(r) && r.conditions.length === 0 ? "✓ Safety checks passed · Required maintenance complete" : readableTimes(r.summary)}</small></span><span className="selection-dot" aria-hidden="true">{selected ? "●" : "○"}</span>
                  </button>;
                })}
              </div>
              <details className="inline-search" hidden={!canCustomer}><summary>Search by equipment need, ID or serial</summary><label>Equipment lookup<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Generator, EQ-1001, or serial number" /></label>
                {search && <div><p>{search.message}</p><div className="button-row">{search.matches.map(m => <button className="secondary" disabled={!isCS || draft?.status === "Confirmed"} key={m.equipment_id} onClick={() => confirmEquipment(m.equipment_id, search.exact)}>{m.equipment_id} · {m.equipment_type} · Select equipment</button>)}</div></div>}
              </details>
              {result && result.conditions.length > 0 && <div className="inline-conditions"><strong>Rental conditions</strong>{result.conditions.map(c => <p key={c}>{readableTimes(c)}</p>)}<button className="text-action" onClick={reviewBlockers}>Review service details</button></div>}
              <button className="text-action" onClick={() => { setFindingsOpen(v => !v); }}>View readiness details {findingsOpen ? "−" : "+"}</button>
        <section className="panel decision-panel" hidden={!findingsOpen}>
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
                    hidden={!canCustomer || !rentalStarted}
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
              <details id="readiness-findings" open={findingsOpen} onToggle={e => setFindingsOpen(e.currentTarget.open)}>
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
              <section className="panel customer-step" id="product-customer" hidden={!canCustomer}>
                <button className="step-heading" aria-expanded={customerExpanded} onClick={() => setCustomerExpanded(v => !v)}><span>{customerExpanded ? "⌄" : "›"} Customer details</span><small>{rentalStarted ? customer.route + " customer" : "Continue when the customer chooses to rent"}</small></button>
                <div className="customer-route-options">{(["Existing", "New", "Uncertain"] as const).map(route => <button key={route} disabled={!isCS || !rentalStarted} aria-pressed={customer.route === route} className={customer.route === route ? "" : "secondary"} onClick={() => { setCustomerExpanded(true); advanceRoutine({ type: "Update customer checks", ...customer, route } as WorkflowCommand, "Select customer type"); }}>{route === "Uncertain" ? "Match uncertain" : route + " customer"}</button>)}</div>
                {!rentalStarted && <p className="form-help">Proceed to rent to protect equipment and complete customer details.</p>}
                <div hidden={!customerExpanded || (!rentalStarted && !isManager)}>
                  {customer.route === "Existing" && <div className="customer-search"><label>Find sample customer<input value={customerQuery} onChange={e => setCustomerQuery(e.target.value)} placeholder="Name, company or phone" /></label>{customerQuery && <div>{customerOptions.length ? customerOptions.map(r => <button key={r.customer_id} className="secondary" disabled={!isCS} onClick={() => chooseCustomer(r)}>{r.intake.renter_name} · {r.intake.company_name || r.customer_id}</button>) : <p>No sample customer matches. Choose New customer to use the assumed registration process.</p>}</div>}</div>}

          <p>
            <strong>{request.intake.renter_name}</strong>
            {request.intake.company_name && " · " + request.intake.company_name}
            <br />
            {request.intake.primary_contact} · {request.intake.contact}
          </p>
          <p className="scope-note">Existing uses the sample customer match. New represents the assumed working registration process; this demo records its checks rather than building a customer registration system.</p>
          <p>
            Customer routing: <strong>{customer.route}</strong>.{" "}
            {customer.route === "New"
              ? "Apply the existing new-customer workflow using this shared intake."
              : customer.route === "Uncertain"
                ? "Resolve the match before confirmation."
                : "Confirm the existing customer match."}
          </p>
          <details open>
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
              <details className="full-width"><summary>Operating schedule</summary>
                <p className="form-help">Record operating windows when required service interrupts the rental. Hours and dates must agree with the requested use.</p>
                {edit.usage.map((window, i) => <div className="form-grid" key={i}>
                  <label>Operating start<input type="datetime-local" value={pacificInput(window.start)} onChange={e => updateUsage(i, { ...window, start: fromPacificInput(e.target.value) })} /></label>
                  <label>Operating end<input type="datetime-local" value={pacificInput(window.end)} onChange={e => updateUsage(i, { ...window, end: fromPacificInput(e.target.value) })} /></label>
                  <label>Operating hours<input type="number" min="0" value={window.hours} onChange={e => updateUsage(i, { ...window, hours: Number(e.target.value) })} /></label>
                  <button className="secondary" onClick={() => { const usage = edit.usage.filter((_, index) => i !== index); setEdit({ ...edit, usage }); setUsageText(JSON.stringify(usage)); }}>Remove window</button>
                </div>)}
                <button className="secondary" onClick={() => { const usage = [...edit.usage, { start: edit.pickup, end: edit.return_at, hours: edit.total_hours }]; setEdit({ ...edit, usage }); setUsageText(JSON.stringify(usage)); }}>Add operating window</button>
              </details>
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

                </div>
              </section>
              <section className="panel agreement-step" id="product-agreement" hidden={!canCustomer}>
                <button className="step-heading" aria-expanded={agreementExpanded} disabled={!rentalStarted && !isManager} onClick={() => setAgreementExpanded(v => !v)}><span>{agreementExpanded ? "⌄" : "›"} Rental agreement</span><small>{draft?.status === "Confirmed" ? "Confirmed" : rentalStarted ? "Review and confirm" : "Available after customer details"}</small></button>
                <div hidden={!agreementExpanded}>
                  <p className="form-help">{availabilityChanged || intakeChanged ? "Save and reevaluate changed request details before approval or acceptance." : checks.length ? "Complete required checks: " + checks.join("; ") : "Required customer checks verified. Review the agreement before approval."}</p>
                  <dl className="agreement-facts"><dt>Equipment</dt><dd>{equipmentId} · {request.equipment_type}</dd><dt>Customer</dt><dd>{request.intake.renter_name}</dd><dt>Rental dates</dt><dd>{stamp(request.pickup)} → {stamp(request.return_at)}</dd><dt>Delivery / pickup</dt><dd>{request.intake.delivery_address}<br />{request.intake.notes}</dd><dt>Agreement</dt><dd>{draft?.status ?? "Not started"}</dd></dl>
                  {result && result.conditions.length > 0 && <div className="inline-conditions"><strong>Customer must accept these conditions</strong>{result.conditions.map(c => <p key={c}>{readableTimes(c)}</p>)}<button className="secondary" disabled={!isCS || draft?.status === "Confirmed"} onClick={() => act({ type: "Decline conditions", request_id: requestId } as WorkflowCommand)}>Record customer decline</button></div>}
{result && <>
              <div className="button-row" hidden={!canCustomer}>
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
                    !isCS || availabilityChanged || intakeChanged || !assigned.length || draft?.status === "Confirmed"
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
                    !isCS || availabilityChanged || intakeChanged ||
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


</>}
                </div>
              </section>
              <div id="product-resolution" hidden={currentView !== "resolution"}>
                <h2>Service & review</h2><p className="form-help">Resolve the recorded blockers or arrange a customer update. Work completion and hold release remain separate actions.</p>
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
            <dl className="decision-facts">{Object.entries(state.dataset.rental_workflow.maintenance_controls.find(c => c.maintenance_id === selectedTask.maintenance_id) ?? {}).map(([key, value]) => <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{typeof value === "boolean" ? value ? "Yes" : "No" : String(value ?? "Not recorded")}</dd></div>)}</dl>
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

              </div>
              <details className="activity-disclosure" id="product-activity" open={historyOpen} onToggle={e => setHistoryOpen(e.currentTarget.open)}><summary>Activity & allocation history</summary>      <details className="panel" >
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
      <details className="panel" >
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
</details>
            </main>
            <aside className="rental-context rental-summary" aria-label="Current rental summary">
              <h2>Rental summary</h2><p className="summary-subtitle">{draft?.status === "Confirmed" ? "Confirmed rental" : rentalStarted ? "Rental in progress" : "Availability inquiry"}</p>
              <div className="summary-row"><ProductIcon name="equipment" /><div><small>Equipment</small><strong>{equipmentId || "None selected"}</strong><span>{selectedAsset?.equipment_type ?? request.equipment_type}</span></div></div>
              <div className="summary-row"><ProductIcon name="calendar" /><div><small>Dates · Pacific</small><strong>{stamp(request.pickup)}</strong><span>Return: {stamp(request.return_at)}</span></div></div>
              <div className="summary-row"><ProductIcon name="clock" /><div><small>Expected use</small><strong>{request.total_hours} operating hours</strong></div></div>
              <div className={`summary-status ${result && isReady(result) ? "ready" : "blocked"}`}><strong>{result?.outcome ?? "Needs review"}</strong><p>{draft?.status === "Confirmed" && result && isReady(result) ? "Rental confirmed for your requested dates. Accepted service conditions remain in force." : result ? readableTimes(result.summary) : "Select equipment to review readiness."}</p>{blockingReasons.length > 0 && <div className="status-blockers"><small>Rental blocked · reason</small><ul>{blockingReasons.map(reason => <li key={reason}>{reason}</li>)}</ul><button className="text-action" onClick={reviewBlockers}>Review blocker details →</button></div>}</div>
              <div className="summary-row"><ProductIcon name="users" /><div><small>Customer</small><strong>{rentalStarted || isManager ? request.intake.renter_name : "Not identified yet"}</strong></div></div>
              <div className="summary-row"><ProductIcon name="shield" /><div><small>Temporary protection</small><strong>{assigned.length ? assigned.map(a => a.equipment_id + " · " + a.status).join("; ") : "Starts when you proceed to rent"}</strong>{assigned.filter(a => a.status === "Temporary").map(a => <span key={a.allocation_id}>Expires {stamp(a.expires_at)}</span>)}<p>Equipment is protected for up to four hours while customer details are completed.</p></div></div>
              <button className="text-action" onClick={reviewBlockers}>View readiness details →</button>
              <p className="next-action" hidden={!rentalStarted}><strong>Next action</strong>{nextStep}</p>
      {pending && <div id="action-evidence">
        <section role="region" aria-label="Action evidence" aria-labelledby="decision-title" className="panel inline-evidence">
          <h3 id="decision-title">Record evidence · {pending.type}</h3>
          <p>Acting as {staff.name} · {staff.role}. Record why this action is appropriate and its supporting evidence. Sample references are sufficient for this fictional demo.</p>
          <label>Decision reason<input autoFocus value={reason} onChange={e => setReason(e.target.value)} /></label>
          <label>Evidence reference<input value={evidence} onChange={e => setEvidence(e.target.value)} /></label>
          <div className="button-row"><button disabled={!reason.trim() || !evidence.trim()} onClick={() => { perform(pending); setPending(null); }}>Confirm action</button><button className="secondary" onClick={() => setPending(null)}>Back without recording</button></div>
        </section>
      </div>}

            </aside>
          </div>
          <footer className="rental-action-bar">
            <p>{draft?.status === "Confirmed" ? "Rental confirmed. Review continuing service conditions." : availabilityChanged ? "Dates or usage changed. Check requested availability before continuing." : !rentalStarted ? "Checking availability only? Finish without customer details." : currentView === "agreement" ? "Review customer checks, approval, and acceptance above." : "Equipment protected while customer details are completed."}</p>
            <div className="button-row">
              {!rentalStarted && isCS && <><button className="text-action" onClick={() => setMessage("Availability inquiry complete. No equipment was allocated and no customer profile was required.")}>Finish inquiry</button><button disabled={!matches.proposal || availabilityChanged} onClick={() => advanceRoutine({ type: "Allocate", request_id: requestId } as WorkflowCommand, "Proceed to rent")}>Proceed to rent →</button></>}
              {rentalStarted && canCustomer && draft?.status !== "Confirmed" && <button onClick={() => navigate("agreement")}>Review rental agreement →</button>}
              {result && !isReady(result) && <button className="secondary" onClick={() => navigate("resolution")}>Review resolution options</button>}
            </div>
          </footer>
          <details className="demo-tools" id="guided-walkthrough"><summary>Demo tools & sample inquiries</summary><p>Sample staff roles are simulated. The September 2026 clock and fictional data reset on reload. Summaries use deterministic rules; no live AI, CRM, or dispatch integration is connected.</p><div className="button-row"><button className="secondary" onClick={() => openExample("REQ-SCN-001")}>1 · Ready to rent</button><button className="secondary" onClick={() => openExample("REQ-SCN-002")}>2 · Blocked rental</button><button className="secondary" onClick={() => openExample("REQ-SCN-004")}>3 · Ready with conditions</button></div><label>Demo request<select value={requestId} onChange={e => { choose(e.target.value); setPending(null); }}>{source.demo_scenarios.map((s, i) => <option key={s.scenario_id} value={source.rental_workflow.rental_requests[i].request_id}>{s.scenario_id} · {s.scenario_name}</option>)}</select></label><p>Demo clock: {stamp(now)} Pacific</p><button className="secondary" onClick={() => setNow(new Date(Date.parse(now) + 4 * 3600000).toISOString())}>Advance four hours</button></details>
        </div>
      </div>
    </section>
  );
}
