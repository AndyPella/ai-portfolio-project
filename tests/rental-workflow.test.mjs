import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createRentalState, requestScope } from "../domain/rental-records.ts";
import {
  validateRentalDataset,
  validateRequest,
} from "../domain/rental-validation.ts";
import {
  evaluateRental,
  proposeEquipment,
  protectedInterval,
} from "../domain/rental-availability.ts";
import {
  applyWorkflow,
  customerGate,
  expireAllocations,
  evaluateSwap,
} from "../domain/rental-workflow.ts";

const source = JSON.parse(
  await readFile(
    new URL("../data/northstar-ridge-demo-data.json", import.meta.url),
    "utf8",
  ),
);
const NOW = "2026-09-05T09:00:00-07:00",
  LATER = "2026-09-05T10:00:00-07:00",
  EXPIRED = "2026-09-05T13:00:00-07:00";
const fresh = () =>
  createRentalState(validateRentalDataset(structuredClone(source)));
const req = (s, i = 0) => s.dataset.rental_workflow.rental_requests[i];
const equipment = (i) => source.demo_scenarios[i].equipment_id;
const run = (s, command, now = NOW) =>
  applyWorkflow(
    s,
    {
      actor: "DEMO-CS",
      reason: "Recorded demo decision",
      evidence: "DEMO-EVIDENCE",
      ...command,
    },
    now,
  );
const evaluate = (s, i = 0) => evaluateRental(s, req(s, i), equipment(i), NOW);
const approve = (s, i = 0) =>
  run(run(s, { type: "Allocate", request_id: req(s, i).request_id }), {
    type: "Approve proposal",
    request_id: req(s, i).request_id,
  });
const accept = (s, i = 0, extra = {}, now = LATER) =>
  run(s, { type: "Accept", request_id: req(s, i).request_id, ...extra }, now);
function delayCase() {
  const s = fresh(),
    r = req(s, 6);
  Object.assign(r, {
    pickup: "2026-10-01T09:00:00-07:00",
    return_at: "2026-10-03T15:00:00-07:00",
    site_documents: "Verified",
    daily_hours: 7,
    total_hours: 20,
  });
  return s;
}
const approveDelay = (s) =>
  run(s, {
    type: "Approve delay",
    actor: "DEMO-MGR",
    request_id: req(s, 6).request_id,
    maintenance_id: "MNT-3007",
    service_at: "2026-10-04T09:00:00-07:00",
    service_meter: 630,
  });
function forecastCase() {
  const s = fresh(),
    m = s.dataset.maintenance[0],
    e = s.dataset.equipment[0];
  Object.assign(m, {
    trigger_type: "Calendar",
    due_date: "2026-09-07",
    due_operating_hours: null,
    scheduled_start: "2026-09-06T09:00:00-07:00",
    scheduled_end: "2026-09-06T15:00:00-07:00",
    status: "Scheduled",
  });
  e.current_status = "Maintenance Scheduled";
  e.current_condition = "Serviceable pending maintenance";
  s.dataset.rental_workflow.holds.push({
    hold_id: "TEST-HOLD",
    equipment_id: e.equipment_id,
    task_id: m.maintenance_id,
    authority: "Mechanic",
    reason: "Required service",
    evidence: m.evidence_reference,
    active: true,
  });
  return s;
}
function swapCase() {
  const s = fresh(),
    r = req(s, 3),
    e = structuredClone(s.dataset.equipment[3]);
  e.equipment_id = "TEST-SPARE";
  e.serial_number = "TEST-SERIAL";
  e.operating_hours = 100;
  s.dataset.equipment.push(e);
  s.dataset.inspections.push({
    ...structuredClone(s.dataset.inspections[3]),
    inspection_id: "TEST-INSPECTION",
    equipment_id: e.equipment_id,
    next_due_hours: 400,
  });
  const p = {
    plan_id: "TEST-SWAP",
    request_id: r.request_id,
    original_id: equipment(3),
    replacement_id: e.equipment_id,
    handoff: "2026-09-12T09:00:00-07:00",
    delivery_at: "2026-09-12T09:00:00-07:00",
    collection_at: "2026-09-12T09:00:00-07:00",
    downtime_hours: 0,
    original_hours: 8,
    replacement_hours: 32,
    confirmed: true,
    evidence: "TEST-TRANSPORT",
    instructions: "Confirmed customer handoff",
    approved_by: "DEMO-MGR",
    request_scope: requestScope(r),
  };
  return { s, r, p };
}

test("source mapping preserves scenario identities and separates customer verification", () => {
  const s = fresh();
  for (let i = 0; i < source.demo_scenarios.length; i++)
    assert.equal(
      evaluate(s, i).outcome,
      source.demo_scenarios[i].expected_outcome,
    );
  assert.equal(evaluate(s, 6).outcome, "Rental Ready");
  assert.ok(
    customerGate(s, req(s, 6)).some((x) => x.includes("documentation")),
  );
});
test("Readiness 1: eligible ready unit is automatically proposed ahead of pending work", () => {
  const s = fresh(),
    copy = structuredClone(s.dataset.equipment[0]);
  copy.equipment_id = "TEST-PENDING";
  copy.current_status = "Inspection Pending";
  s.dataset.equipment.unshift(copy);
  assert.equal(
    proposeEquipment(s, req(s), NOW).proposal.equipment_id,
    "EQ-1001",
  );
});
test("Readiness 2: feasible work forecast includes recorded completion and retains hold", () => {
  const s = forecastCase(),
    r = evaluate(s);
  assert.equal(r.outcome, "Remediation Required");
  assert.equal(r.expected_completion, "2026-09-06T15:00:00-07:00");
  assert.match(r.forecast, /pending/);
  assert.throws(
    () => run(s, { type: "Allocate", request_id: req(s).request_id }),
    /No qualifying/,
  );
  assert.equal(s.dataset.rental_workflow.holds.at(-1).active, true);
  s.dataset.maintenance[0].parts_confirmed = false;
  assert.equal(evaluate(s).expected_completion, null);
});
test("Readiness 3: no qualifying unit routes callback without releasing holds", () => {
  let s = fresh();
  s = run(s, {
    type: "Callback",
    request_id: req(s, 5).request_id,
    equipment_id: equipment(5),
    update_at: EXPIRED,
    question: "Can repair and contradictory records be resolved?",
  });
  assert.equal(s.callbacks[0].reviewer, "Manager");
  assert.equal(s.callbacks[0].status, "Open");
  assert.equal(
    s.dataset.rental_workflow.holds.find((h) => h.equipment_id === equipment(5))
      .active,
    true,
  );
  s = run(s, {
    type: "Review callback",
    actor: "DEMO-MGR",
    callback_id: s.callbacks[0].callback_id,
    result: "Review incomplete; technician still pending",
  });
  assert.equal(s.callbacks[0].status, "Open");
  assert.equal(proposeEquipment(s, req(s, 5), NOW).proposal, null);
});
test("Readiness 4: approved noncritical delay is ready and remains internal staff detail", () => {
  const s = approveDelay(delayCase()),
    result = evaluate(s, 6);
  assert.equal(result.outcome, "Rental Ready");
  assert.deepEqual(result.conditions, []);
  assert.ok(result.findings.some((f) => f.code === "APPROVED_INTERNAL_DELAY"));
  assert.equal(
    result.summary,
    "This unit is available for your requested dates.",
  );
});
test("Readiness 5: mandatory service stop requires exact usage timing and customer acceptance", () => {
  let s = fresh();
  assert.equal(evaluate(s, 3).outcome, "Rental Ready with Conditions");
  s = approve(s, 3);
  assert.throws(() => accept(s, 3), /acceptance of all current conditions/);
  assert.equal(
    accept(s, 3, { accept_conditions: true }).allocations[0].status,
    "Confirmed",
  );
  const changed = fresh();
  req(changed, 3).usage = [];
  assert.equal(evaluate(changed, 3).outcome, "Human Review Required");
  changed.dataset.maintenance[3].scheduled_start = null;
  changed.dataset.maintenance[3].scheduled_end = null;
  assert.equal(evaluate(changed, 3).outcome, "Not Available");
});
test("Readiness 6: warranty and task restrictions override fictional allowance", () => {
  const s = delayCase(),
    c = s.dataset.rental_workflow.maintenance_controls[6];
  Object.assign(c, {
    warranty_status: "Covered",
    warranty_max_days: 0,
    warranty_max_hours: 0,
  });
  assert.throws(() => approveDelay(s), /policy, task or warranty/);
  c.warranty_status = "Unknown";
  assert.equal(evaluate(s, 6).outcome, "Human Review Required");
  c.warranty_status = "Out of warranty";
  c.warranty_max_days = null;
  c.warranty_max_hours = null;
  c.task_max_days = 1;
  assert.throws(() => approveDelay(s), /policy, task or warranty/);
});
test("Readiness 7: known repair outranks contradiction; completion alone cannot release hold", () => {
  let s = fresh();
  assert.equal(evaluate(s, 5).outcome, "Remediation Required");
  assert.ok(
    evaluate(s, 5).findings.some(
      (f) => f.code === "CONTRADICTORY_READY_STATUS",
    ),
  );
  assert.throws(
    () =>
      run(s, { type: "Release hold", actor: "DEMO-CS", hold_id: "HOLD-1006" }),
    /authority/,
  );
  s = run(s, {
    type: "Complete work",
    actor: "DEMO-MECH",
    maintenance_id: "MNT-3006",
  });
  assert.throws(
    () =>
      run(s, { type: "Release hold", actor: "DEMO-MGR", hold_id: "HOLD-1006" }),
    /post-work inspection/,
  );
  s = run(s, {
    type: "Pass inspection",
    actor: "DEMO-INSP",
    equipment_id: "EQ-1006",
    valid_until: "2026-12-31",
    next_due_hours: 900,
  });
  s = run(s, { type: "Reconcile", actor: "DEMO-MGR", equipment_id: "EQ-1006" });
  s = run(s, { type: "Release hold", actor: "DEMO-MGR", hold_id: "HOLD-1006" });
  assert.equal(evaluate(s, 5).outcome, "Rental Ready");
  assert.equal(s.decisions.length, 4);
});
test("Readiness 8: changed usage rechecks service and a confirmed two-unit swap can qualify", () => {
  const { s, r, p } = swapCase();
  assert.equal(evaluateSwap(s, r, p, NOW).eligible, true);
  const changed = { ...r, total_hours: 50, usage: [] };
  assert.equal(evaluateSwap(s, changed, p, NOW).eligible, false);
  assert.equal(
    evaluateSwap(s, r, { ...p, original_hours: 20, replacement_hours: 20 }, NOW)
      .eligible,
    false,
  );
  const unsafe = structuredClone(s);
  unsafe.dataset.rental_workflow.holds.push({
    hold_id: "SPARE-HOLD",
    equipment_id: p.replacement_id,
    task_id: "Safety concern",
    authority: "Manager",
    reason: "Unsafe",
    evidence: "TEST",
    active: true,
  });
  assert.equal(evaluateSwap(unsafe, r, p, NOW).eligible, false);
});

test("Customer Service 1: final acceptance requires approval and preserves assignment", () => {
  let s = fresh();
  s = run(s, { type: "Allocate", request_id: req(s).request_id });
  assert.throws(() => accept(s), /staff approval/);
  const id = s.allocations[0].allocation_id;
  s = run(s, { type: "Approve proposal", request_id: req(s).request_id });
  s = accept(s);
  assert.equal(s.allocations[0].allocation_id, id);
  assert.equal(s.allocations[0].status, "Confirmed");
  assert.equal(s.drafts[req(s).request_id].status, "Confirmed");
});
test("Customer Service 2: shared intake survives parallel new profile verification", () => {
  let s = fresh(),
    c = s.dataset.rental_workflow.customer_checks[0];
  c.route = "New";
  c.profile = "Pending";
  s = approve(s);
  assert.equal(s.allocations[0].status, "Temporary");
  assert.throws(() => accept(s), /profile: Pending/);
  const notes = req(s).intake.notes;
  s = run(s, { type: "Update customer checks", ...c, profile: "Verified" });
  s = accept(s);
  assert.equal(req(s).intake.notes, notes);
  assert.equal(s.allocations[0].status, "Confirmed");
});
test("Customer Service 3: callback remains open until CS records update, then released unit can be allocated", () => {
  let s = fresh(),
    r = req(s, 1);
  s = run(s, {
    type: "Callback",
    request_id: r.request_id,
    equipment_id: equipment(1),
    update_at: EXPIRED,
    question: "Can post-rental check pass?",
  });
  s = run(s, {
    type: "Pass inspection",
    actor: "DEMO-MECH",
    equipment_id: equipment(1),
    valid_until: "2026-12-31",
    next_due_hours: 2000,
  });
  s = run(s, {
    type: "Release hold",
    actor: "DEMO-MECH",
    hold_id: "HOLD-1002",
  });
  assert.equal(evaluate(s, 1).outcome, "Rental Ready");
  s = run(s, {
    type: "Review callback",
    actor: "DEMO-MECH",
    callback_id: s.callbacks[0].callback_id,
    result: "Passed check and released hold",
  });
  assert.equal(s.callbacks[0].status, "Open");
  s = run(s, { type: "Allocate", request_id: r.request_id });
  s = run(s, {
    type: "Record customer update",
    callback_id: s.callbacks[0].callback_id,
    result: "Equipment now qualifies; agreement preparation continues",
  });
  assert.equal(s.callbacks[0].status, "Closed");
  assert.equal(s.allocations[0].status, "Temporary");
});
test("Customer Service 4: expiry is exact at four hours, retains draft, and reacquisition renews lifespan", () => {
  let s = approve(fresh()),
    id = req(s).request_id,
    notes = req(s).intake.notes;
  assert.equal(
    expireAllocations(s, "2026-09-05T12:59:59-07:00").allocations[0].status,
    "Temporary",
  );
  const expired = expireAllocations(s, EXPIRED);
  assert.equal(expired.allocations[0].status, "Expired");
  assert.equal(expired.drafts[id].status, "Draft");
  assert.equal(req(expired).intake.notes, notes);
  assert.throws(
    () => accept(expired, 0, {}, EXPIRED),
    /acquire current temporary/,
  );
  s = run(expired, { type: "Allocate", request_id: id }, EXPIRED);
  assert.equal(s.allocations.at(-1).expires_at, "2026-09-06T00:00:00.000Z");
  assert.throws(() => accept(s, 0, {}, EXPIRED), /staff approval/);
  s = run(s, { type: "Approve proposal", request_id: id }, EXPIRED);
  assert.equal(
    accept(s, 0, {}, EXPIRED).allocations.at(-1).status,
    "Confirmed",
  );
});
test("Customer Service 5: safety hold raised during allocation blocks confirmation and retains draft", () => {
  let s = approve(fresh());
  s = run(s, {
    type: "Place hold",
    actor: "DEMO-MECH",
    equipment_id: equipment(0),
    task_id: "Safety concern",
    authority: "Mechanic",
  });
  const before = JSON.stringify(s);
  assert.throws(() => accept(s), /No qualifying/);
  assert.equal(JSON.stringify(s), before);
  assert.equal(s.drafts[req(s).request_id].status, "Draft");
  assert.equal(s.allocations[0].status, "Temporary");
});
test("Customer Service 6: required billing and both insurance checks independently gate acceptance", () => {
  for (const field of [
    "billing",
    "insurance_on_site",
    "insurance_transport",
    "identity",
    "profile",
  ]) {
    const s = fresh();
    s.dataset.rental_workflow.customer_checks[0][field] = "Pending";
    assert.throws(() => accept(approve(s)), /Required checks/);
  }
  const s = fresh();
  s.dataset.rental_workflow.customer_checks[0].route = "Uncertain";
  assert.throws(() => accept(approve(s)), /Resolve customer match/);
});
test("Customer Service 7: swap protects both segments, renews acceptance and preserves rental charge", () => {
  let { s, r, p } = swapCase();
  s = run(s, { type: "Record swap", actor: "DEMO-MGR", plan: p });
  s = approve(s, 3);
  assert.equal(s.allocations.length, 2);
  assert.ok(
    evaluateSwap(s, r, s.swap_plans[0], NOW).conditions[0].includes(
      "agreed rental charge applies",
    ),
  );
  assert.throws(() => accept(s, 3), /acceptance/);
  s = accept(s, 3, { accept_conditions: true });
  assert.ok(s.allocations.every((a) => a.status === "Confirmed"));
  const changed = swapCase();
  let d = run(changed.s, {
    type: "Record swap",
    actor: "DEMO-MGR",
    plan: changed.p,
  });
  d = approve(d, 3);
  d.service_plans.push({
    plan_id: "EDITED",
    request_id: r.request_id,
    equipment_id: p.replacement_id,
    maintenance_id: "TEST",
    start: p.handoff,
    end: "2026-09-12T10:00:00-07:00",
    confirmed: true,
    logistics_confirmed: true,
    evidence: "Changed",
    instructions: "Changed plan",
  });
  assert.throws(
    () => accept(d, 3, { accept_conditions: true }),
    /acquire current/,
  );
});
test("Customer Service 8: pre-acceptance cancellation releases allocation; confirmation survives timer", () => {
  let s = approve(fresh()),
    id = req(s).request_id;
  s = run(s, { type: "Cancel", request_id: id });
  assert.equal(s.allocations[0].status, "Canceled");
  assert.equal(s.drafts[id].status, "Canceled");
  assert.throws(() => accept(s), /Canceled/);
  const confirmed = accept(approve(fresh()));
  assert.equal(
    expireAllocations(confirmed, EXPIRED).allocations[0].status,
    "Confirmed",
  );
  assert.throws(
    () => run(confirmed, { type: "Cancel", request_id: id }),
    /separate cancellation/,
  );
});

test("protected buffers include recorded longer work, exact adjacency is allowed, proposed rows do not block", () => {
  const s = fresh(),
    r = req(s),
    [a, b] = protectedInterval(r);
  assert.equal(a, Date.parse(r.pickup) - 2 * 3600000);
  assert.equal(b, Date.parse(r.return_at) + 2 * 3600000);
  const booking = {
    ...s.dataset.reservations[0],
    reservation_id: "TEST-ADJ",
    status: "Hold",
    end_date: "2026-09-08",
    preparation_buffer_hours: 2,
    return_buffer_hours: 2,
  };
  s.dataset.reservations.push(booking);
  s.dataset.rental_workflow.reservation_timing.push({
    reservation_id: "TEST-ADJ",
    pickup: "2026-09-07T09:00:00-07:00",
    return_at: "2026-09-08T05:00:00-07:00",
    timezone: r.timezone,
  });
  assert.equal(evaluate(s).outcome, "Rental Ready");
  booking.return_buffer_hours = 3;
  assert.equal(evaluate(s).outcome, "Not Available");
});
test("competing drafts conflict atomically while self allocation is excluded", () => {
  let s = fresh(),
    other = structuredClone(req(s));
  other.request_id = "TEST-REQUEST";
  s.dataset.rental_workflow.rental_requests.push(other);
  s = run(s, { type: "Allocate", request_id: req(s).request_id });
  assert.equal(evaluate(s).outcome, "Rental Ready");
  assert.throws(
    () => run(s, { type: "Allocate", request_id: other.request_id }),
    /No qualifying/,
  );
  assert.equal(
    evaluateRental(s, other, equipment(0), EXPIRED).outcome,
    "Rental Ready",
  );
});
test("unknown classification/version/warranty never implies delay permission", () => {
  for (const field of [
    "criticality",
    "policy_version",
    "warranty_status",
    "assessment_evidence",
  ]) {
    const s = delayCase(),
      c = s.dataset.rental_workflow.maintenance_controls[6];
    c[field] =
      field === "criticality"
        ? "Unclassified"
        : field === "warranty_status"
          ? "Unknown"
          : "missing";
    assert.equal(evaluate(s, 6).outcome, "Human Review Required");
    assert.throws(() => approveDelay(s));
  }
});
test("fictional delay uses first limit reached, not days or hours as alternatives", () => {
  const s = delayCase();
  assert.throws(
    () =>
      run(s, {
        type: "Approve delay",
        actor: "DEMO-MGR",
        request_id: req(s, 6).request_id,
        maintenance_id: "MNT-3007",
        service_at: "2026-10-09T09:00:00-07:00",
        service_meter: 630,
      }),
    /exceeds/,
  );
  const c = s.dataset.rental_workflow.maintenance_controls[6],
    m = s.dataset.maintenance[6],
    r = req(s, 6);
  m.due_operating_hours = 615;
  r.usage = [
    {
      start: "2026-10-01T09:00:00-07:00",
      end: "2026-10-01T16:00:00-07:00",
      hours: 7,
    },
    {
      start: "2026-10-02T09:00:00-07:00",
      end: "2026-10-02T16:00:00-07:00",
      hours: 7,
    },
    {
      start: "2026-10-03T09:00:00-07:00",
      end: "2026-10-03T15:00:00-07:00",
      hours: 6,
    },
  ];
  c.task_max_hours = 10;
  assert.throws(() => approveDelay(s), /exceeds/);
});
test("unauthorized roles and unqualified mechanics cannot certify work or approve delays", () => {
  const s = fresh();
  assert.throws(
    () =>
      run(s, {
        type: "Complete work",
        actor: "DEMO-VIEW",
        maintenance_id: "MNT-3001",
      }),
    /authority/,
  );
  s.dataset.rental_workflow.staff.find(
    (s) => s.staff_id === "DEMO-MECH",
  ).qualifications = [];
  assert.throws(
    () =>
      run(s, {
        type: "Complete work",
        actor: "DEMO-MECH",
        maintenance_id: "MNT-3001",
      }),
    /qualification/,
  );
  assert.throws(
    () =>
      run(delayCase(), {
        type: "Approve delay",
        actor: "DEMO-MECH",
        request_id: req(delayCase(), 6).request_id,
        maintenance_id: "MNT-3007",
        service_at: "2026-10-04T09:00:00-07:00",
        service_meter: 630,
      }),
    /authority/,
  );
});
test("releasing one routine hold leaves another active and preserves its blocker", () => {
  let s = fresh();
  for (let i = 0; i < 2; i++)
    s = run(s, {
      type: "Place hold",
      actor: "DEMO-MECH",
      equipment_id: "EQ-1001",
      task_id: "MNT-3001",
      authority: "Mechanic",
    });
  s = run(s, {
    type: "Complete work",
    actor: "DEMO-MECH",
    maintenance_id: "MNT-3001",
  });
  s = run(s, {
    type: "Pass inspection",
    actor: "DEMO-INSP",
    equipment_id: "EQ-1001",
    valid_until: "2026-12-31",
    next_due_hours: 1400,
  });
  const id = s.dataset.rental_workflow.holds.at(-2).hold_id;
  s = run(s, { type: "Release hold", actor: "DEMO-MECH", hold_id: id });
  assert.equal(
    s.dataset.rental_workflow.holds.find((h) => h.hold_id === id).active,
    false,
  );
  assert.equal(s.dataset.rental_workflow.holds.at(-1).active, true);
  assert.equal(evaluate(s).outcome, "Remediation Required");
});
test("misuse and delivery/pickup causes cannot bypass an unsafe defect", () => {
  for (const cause of [
    "Misuse",
    "Delivery damage",
    "Pickup damage",
    "Operational Failure",
  ]) {
    const s = fresh();
    s.dataset.maintenance[5].notes = cause;
    assert.equal(evaluate(s, 5).outcome, "Remediation Required");
  }
});
test("changed dates, instructions and hours invalidate approval and recheck protected intervals", () => {
  let s = approve(fresh()),
    r = structuredClone(req(s));
  r.intake.notes = "Loading requires three extra hours";
  r.preparation_hours = 5;
  s = run(s, { type: "Update request", request: r });
  assert.throws(() => accept(s), /acquire current/);
  const delay = approveDelay(delayCase());
  req(delay, 6).total_hours = 21;
  assert.equal(evaluate(delay, 6).outcome, "Human Review Required");
});
test("future horizon is not capped at five or thirty days, but inspection coverage remains required", () => {
  const s = fresh(),
    r = req(s);
  s.dataset.reservations = s.dataset.reservations.filter(
    (x) => x.equipment_id !== "EQ-1001" || x.status !== "Confirmed",
  );
  Object.assign(r, {
    pickup: "2026-11-01T09:00:00-08:00",
    return_at: "2026-11-02T15:00:00-08:00",
    total_hours: 8,
    daily_hours: 4,
  });
  assert.equal(evaluate(s).outcome, "Rental Ready");
  assert.equal(evaluate(s).in_time, false);
  r.return_at = "2026-12-01T15:00:00-08:00";
  assert.equal(evaluate(s).outcome, "Remediation Required");
});
test("invalid times, timezone offsets, hours, missing fields and duplicate workflow IDs fail closed", () => {
  const s = fresh(),
    r = req(s);
  assert.throws(() =>
    validateRequest({ ...r, pickup: "2026-02-30T09:00:00-07:00" }),
  );
  assert.throws(() => validateRequest({ ...r, pickup: "2026-09-08" }));
  assert.throws(
    () => validateRequest({ ...r, pickup: "2026-09-08T09:00:00Z" }),
    /branch timezone/,
  );
  assert.throws(() => validateRequest({ ...r, total_hours: NaN }));
  s.dataset.rental_workflow.staff.push(s.dataset.rental_workflow.staff[0]);
  assert.throws(() => validateRentalDataset(s.dataset), /duplicate/);
});
test("precedence keeps all conflict, repair, contradiction and hold evidence", () => {
  const s = fresh(),
    r = req(s, 5);
  s.dataset.reservations.push({
    ...s.dataset.reservations[0],
    reservation_id: "CONFLICT",
    equipment_id: "EQ-1006",
    start_date: "2026-09-08",
    end_date: "2026-09-09",
    status: "Confirmed",
  });
  const result = evaluateRental(s, r, "EQ-1006", NOW);
  assert.equal(result.outcome, "Not Available");
  for (const code of [
    "RESERVATION_CONFLICT",
    "CONTRADICTORY_READY_STATUS",
    "ACTIVE_HOLD",
    "DEFECT",
  ])
    assert.ok(result.findings.some((f) => f.code === code));
  assert.equal(result.expected_completion, null);
});
test("evaluations and failed commands leave source, allocation and decision history unchanged", () => {
  const s = fresh(),
    before = JSON.stringify(s);
  proposeEquipment(s, req(s), NOW);
  assert.throws(() =>
    run(s, {
      type: "Complete work",
      actor: "DEMO-CS",
      maintenance_id: "MNT-3001",
    }),
  );
  assert.equal(JSON.stringify(s), before);
});

test("customer decline releases protection and excludes this conditional option", () => {
  let s = approve(fresh(), 3);
  s = run(s, { type: "Decline conditions", request_id: req(s, 3).request_id });
  assert.equal(s.allocations[0].status, "Canceled");
  assert.equal(evaluate(s, 3).outcome, "Not Available");
  assert.ok(
    evaluate(s, 3).findings.some((f) => f.code === "CONDITIONS_DECLINED"),
  );
});
test("denied review remains unavailable until revised or superseded by authorized review", () => {
  let s = fresh();
  s = run(s, {
    type: "Callback",
    request_id: req(s, 1).request_id,
    equipment_id: equipment(1),
    update_at: EXPIRED,
    question: "Can work finish?",
  });
  s = run(s, {
    type: "Review callback",
    actor: "DEMO-MECH",
    callback_id: s.callbacks[0].callback_id,
    result: "Cannot finish for these dates",
    review_status: "Denied",
  });
  assert.equal(evaluate(s, 1).outcome, "Not Available");
  assert.equal(s.dataset.rental_workflow.holds[0].active, true);
  s = run(s, {
    type: "Review callback",
    actor: "DEMO-MECH",
    callback_id: s.callbacks[0].callback_id,
    result: "Still investigating",
    review_status: "Incomplete",
  });
  assert.equal(evaluate(s, 1).outcome, "Remediation Required");
});
test("past service schedule cannot substitute for verified completion", () => {
  const s = fresh(),
    r = evaluateRental(s, req(s, 3), equipment(3), "2026-09-15T13:00:00-07:00");
  assert.equal(r.outcome, "Remediation Required");
  assert.ok(r.findings.some((f) => f.code === "SERVICE_VERIFICATION"));
});
test("work completed after preparation starts requires revised pickup", () => {
  let s = fresh();
  s = run(
    s,
    {
      type: "Pass inspection",
      actor: "DEMO-INSP",
      equipment_id: "EQ-1001",
      valid_until: "2026-12-31",
      next_due_hours: 1400,
    },
    "2026-09-08T08:00:00-07:00",
  );
  const r = evaluateRental(s, req(s), "EQ-1001", "2026-09-08T08:00:00-07:00");
  assert.equal(r.outcome, "Not Available");
  assert.ok(r.findings.some((f) => f.code === "PREPARATION_INCOMPLETE"));
});

test("Operational Failure cause classification explicitly excludes misuse and transport damage", async () => {
  const { classifyFailure } = await import("../domain/rental-availability.ts");
  assert.equal(
    classifyFailure("Normal intended operation"),
    "Operational Failure",
  );
  for (const cause of ["Misuse", "Delivery damage", "Pickup damage"])
    assert.equal(classifyFailure(cause), "Excluded from Operational Failure");
  assert.equal(
    classifyFailure("Unknown"),
    "Cause requires qualified assessment",
  );
});
test("equipment search normalizes exact IDs and requires clarification for ambiguous lift needs", async () => {
  const { findEquipment } = await import("../domain/equipment-search.ts");
  for (const id of ["EQ-1001", "eq1001", "eq 1001"])
    assert.equal(
      findEquipment(source.equipment, id).matches[0].equipment_id,
      "EQ-1001",
    );
  assert.equal(
    findEquipment(source.equipment, "I need a generator").matches[0]
      .equipment_type,
    "Towable generator",
  );
  const lift = findEquipment(source.equipment, "lift");
  assert.equal(lift.exact, false);
  assert.match(lift.message, /Clarify/);
  assert.ok(lift.matches.length > 1);
  assert.equal(findEquipment(source.equipment, "EQ-9999").matches.length, 0);
});

test("intervening future commitments require projected usage and post-rental check review", () => {
  const s = fresh(),
    r = req(s);
  r.pickup = "2026-11-01T09:00:00-08:00";
  r.return_at = "2026-11-02T15:00:00-08:00";
  r.total_hours = 8;
  r.daily_hours = 4;
  const result = evaluate(s);
  assert.equal(result.outcome, "Human Review Required");
  assert.ok(result.findings.some((f) => f.code === "INTERVENING_RENTAL"));
});
test("inspection certification requires qualification for the particular equipment type", () => {
  const s = fresh(),
    person = s.dataset.rental_workflow.staff.find(
      (x) => x.staff_id === "DEMO-INSP",
    );
  person.qualifications = person.qualifications.filter(
    (q) => q !== "inspection:Compact excavator",
  );
  assert.throws(
    () =>
      run(s, {
        type: "Pass inspection",
        actor: "DEMO-INSP",
        equipment_id: "EQ-1001",
        valid_until: "2026-12-31",
        next_due_hours: 1400,
      }),
    /qualification/,
  );
});

test("approved current noncritical delay changes applicable limit without inventing completion or hiding safety", () => {
  let s = fresh(),
    r = req(s, 6),
    m = s.dataset.maintenance[6];
  m.due_date = "2026-09-04";
  m.operational_interruption = "Planned interruption";
  Object.assign(r, {
    pickup: "2026-09-08T09:00:00-07:00",
    return_at: "2026-09-09T15:00:00-07:00",
    total_hours: 20,
    daily_hours: 10,
    site_documents: "Verified",
  });
  s = run(s, {
    type: "Approve delay",
    actor: "DEMO-MGR",
    request_id: r.request_id,
    maintenance_id: m.maintenance_id,
    service_at: "2026-09-10T09:00:00-07:00",
    service_meter: 630,
  });
  assert.equal(evaluate(s, 6).outcome, "Rental Ready");
  assert.equal(evaluate(s, 6).current.readiness_outcome, "Equipment Ready");
  assert.equal(s.dataset.maintenance[6].due_date, "2026-09-04");
  assert.notEqual(s.dataset.maintenance[6].status, "Complete");
  s.dataset.inspections[6].result = "Failed";
  assert.equal(evaluate(s, 6).outcome, "Remediation Required");
});
test("known planned interruptions are disclosed even when service is not yet due", () => {
  const s = fresh(),
    m = s.dataset.maintenance[3];
  m.due_operating_hours = 900;
  const result = evaluate(s, 3);
  assert.equal(result.outcome, "Rental Ready with Conditions");
  assert.equal(result.interruption_hours, 2);
  m.scheduled_end = "2026-09-15T11:00:00-07:00";
  assert.equal(evaluate(s, 3).outcome, "Not Available");
});

test("maintenance certification needs task-specific qualification in addition to role and group", () => {
  const s = fresh(),
    person = s.dataset.rental_workflow.staff.find(
      (x) => x.staff_id === "DEMO-MECH",
    );
  person.qualifications = person.qualifications.filter(
    (q) => q !== "maintenance:MNT-3001",
  );
  assert.throws(
    () =>
      run(s, {
        type: "Complete work",
        actor: "DEMO-MECH",
        maintenance_id: "MNT-3001",
      }),
    /qualification/,
  );
});

test("a later authorized review supersedes earlier denial without deleting callback history", () => {
  let s = fresh(),
    r = req(s, 1);
  s = run(s, {
    type: "Callback",
    request_id: r.request_id,
    equipment_id: equipment(1),
    update_at: EXPIRED,
    question: "Can checks finish?",
  });
  const first = s.callbacks[0].callback_id;
  s = run(s, {
    type: "Review callback",
    actor: "DEMO-MECH",
    callback_id: first,
    result: "Not feasible yet",
    review_status: "Denied",
  });
  s = run(s, {
    type: "Record customer update",
    callback_id: first,
    result: "Not available; further review requested",
  });
  s = run(s, {
    type: "Callback",
    request_id: r.request_id,
    equipment_id: equipment(1),
    update_at: EXPIRED,
    question: "Can updated inspection resolve the hold?",
  });
  s = run(s, {
    type: "Pass inspection",
    actor: "DEMO-MECH",
    equipment_id: equipment(1),
    valid_until: "2026-12-31",
    next_due_hours: 2000,
  });
  s = run(s, {
    type: "Release hold",
    actor: "DEMO-MECH",
    hold_id: "HOLD-1002",
  });
  assert.equal(evaluate(s, 1).outcome, "Not Available");
  s = run(s, {
    type: "Review callback",
    actor: "DEMO-MECH",
    callback_id: s.callbacks[1].callback_id,
    result: "Passed check and released hold; earlier denial superseded",
    review_status: "Complete",
  });
  assert.equal(evaluate(s, 1).outcome, "Rental Ready");
  assert.equal(s.callbacks[0].review_status, "Denied");
  assert.equal(s.callbacks.length, 2);
});

test("critical work may finish after its due date while stopped, provided it finishes before preparation", () => {
  const s = forecastCase();
  s.dataset.maintenance[0].due_date = "2026-09-04";
  const result = evaluate(s);
  assert.equal(result.outcome, "Remediation Required");
  assert.equal(result.current.readiness_outcome, "Maintenance Required");
  assert.equal(result.expected_completion, "2026-09-06T15:00:00-07:00");
  assert.match(result.forecast, /pending work/);
  assert.throws(
    () => run(s, { type: "Allocate", request_id: req(s).request_id }),
    /No qualifying/,
  );
});

test("impossible total and daily usage is rejected instead of becoming an availability promise", () => {
  const s = fresh(),
    r = req(s);
  assert.throws(
    () =>
      validateRequest({
        ...r,
        return_at: "2026-09-08T10:00:00-07:00",
        total_hours: 2,
        daily_hours: 2,
      }),
    /Total usage/,
  );
  assert.throws(
    () => validateRequest({ ...r, total_hours: 40, daily_hours: 1 }),
    /daily estimate/,
  );
});
test("completed service does not erase its documented next mandatory limit", () => {
  const s = fresh(),
    r = req(s, 3);
  s.dataset.maintenance[3].status = "Complete";
  s.dataset.inspections[3].next_due_hours = 2000;
  Object.assign(r, {
    return_at: "2026-10-10T15:00:00-07:00",
    total_hours: 520,
    daily_hours: 24,
    usage: [],
  });
  const result = evaluate(s, 3);
  assert.equal(result.outcome, "Not Available");
  assert.ok(result.findings.some((f) => f.code === "NEXT_SERVICE_LIMIT"));
});
