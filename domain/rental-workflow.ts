import { evaluateEquipmentReadiness } from "./equipment-readiness.ts";
import {
  delayPermitted,
  evaluateRental,
  isComplete,
  isReady,
  proposeEquipment,
  hoursBefore,
  evidencePresent,
  type RentalEvaluation,
} from "./rental-availability.ts";
import {
  localDate,
  timestamp,
  validateRentalDataset,
} from "./rental-validation.ts";
import {
  requestScope,
  type RentalRequest,
  type RentalState,
  type Role,
  type SwapPlan,
  type Staff,
  type Decision,
} from "./rental-records.ts";

export function customerGate(state: RentalState, r: RentalRequest): string[] {
  const c = state.dataset.rental_workflow.customer_checks.find(
    (c) => c.customer_id === r.customer_id,
  );
  if (!c) return ["Customer match and required checks are missing."];
  const pending: string[] = [];
  if (c.route === "Uncertain")
    pending.push("Resolve customer match; do not create a duplicate.");
  for (const field of [
    "identity",
    "profile",
    "billing",
    "insurance_on_site",
    "insurance_transport",
  ] as const)
    if (c[field] !== "Verified")
      pending.push(`${field.replaceAll("_", " ")}: ${c[field]}`);
  if (r.site_documents !== "Verified")
    pending.push("Required site documentation: " + r.site_documents);
  for (const [field, value] of Object.entries(r.intake))
    if (field !== "company_name" && field !== "notes" && !value.trim())
      pending.push("Missing " + field.replaceAll("_", " "));
  const customer = state.dataset.customer_requirements.find(
    (c) => c.customer_id === r.customer_id,
  );
  if (customer?.customer_type !== "Homeowner" && !r.intake.company_name.trim())
    pending.push("Company name required.");
  return pending;
}
function staff(
  state: RentalState,
  id: string,
  roles: Role[],
  qualification?: string,
): Staff {
  const s = state.dataset.rental_workflow.staff.find((s) => s.staff_id === id);
  if (
    !s ||
    !roles.includes(s.role) ||
    (qualification && !s.qualifications.includes(qualification))
  )
    throw new Error(
      "Staff authority or task qualification does not permit this action",
    );
  return s;
}
export function expireAllocations(
  state: RentalState,
  now: string,
): RentalState {
  const next = structuredClone(state),
    at = timestamp(now);
  for (const a of next.allocations)
    if (a.status === "Temporary" && timestamp(a.expires_at) <= at) {
      a.status = "Expired";
      next.decisions.push({
        decision_id: "DEC-" + (next.decisions.length + 1),
        actor: "Allocation timer",
        timestamp: now,
        equipment_id: a.equipment_id,
        reference: a.allocation_id,
        action: "Expired",
        reason: "Four-hour temporary protection elapsed",
        evidence: a.expires_at,
        scope: a.scope,
      });
    }
  return next;
}
export function evaluateSwap(
  state: RentalState,
  r: RentalRequest,
  plan: SwapPlan,
  now: string,
): { eligible: boolean; results: RentalEvaluation[]; conditions: string[] } {
  const manager = state.dataset.rental_workflow.staff.find(
    (s) => s.staff_id === plan.approved_by && s.role === "Manager",
  );
  const valid =
    plan.request_id === r.request_id &&
    plan.request_scope === requestScope(r) &&
    plan.original_id !== plan.replacement_id &&
    plan.confirmed &&
    plan.evidence &&
    manager &&
    Number.isFinite(plan.downtime_hours) &&
    plan.downtime_hours >= 0 &&
    timestamp(plan.handoff) > timestamp(r.pickup) &&
    timestamp(plan.handoff) < timestamp(r.return_at) &&
    timestamp(plan.delivery_at) <= timestamp(plan.handoff) &&
    timestamp(plan.collection_at) >= timestamp(plan.handoff) &&
    plan.original_hours >= 0 &&
    plan.replacement_hours >= 0 &&
    Math.abs(plan.original_hours + plan.replacement_hours - r.total_hours) <
      0.001;
  if (!valid) return { eligible: false, results: [], conditions: [] };
  const before = hoursBefore(r, plan.handoff);
  if (before === null || Math.abs(before - plan.original_hours) > 0.001)
    return { eligible: false, results: [], conditions: [] };
  // Handoff/downtime and collection must precede any use by the replacement.
  if (
    r.usage.some(
      (w) =>
        timestamp(w.start) >= timestamp(plan.handoff) &&
        timestamp(w.start) <
          timestamp(plan.handoff) + plan.downtime_hours * 3600000,
    )
  )
    return { eligible: false, results: [], conditions: [] };
  const first = {
    ...r,
    return_at: plan.collection_at,
    total_hours: plan.original_hours,
    usage: r.usage.filter((w) => timestamp(w.end) <= timestamp(plan.handoff)),
  };
  const second = {
    ...r,
    pickup: plan.handoff,
    total_hours: plan.replacement_hours,
    usage: r.usage.filter((w) => timestamp(w.start) >= timestamp(plan.handoff)),
  };
  const results = [
    evaluateRental(state, first, plan.original_id, now),
    evaluateRental(state, second, plan.replacement_id, now),
  ];
  // No operation at/after the original threshold, including loading/collection timing.
  const e = state.dataset.equipment.find(
    (e) => e.equipment_id === plan.original_id,
  )!;
  const limitsPass = state.dataset.maintenance
    .filter((m) => m.equipment_id === plan.original_id && !isComplete(m.status))
    .every(
      (m) =>
        (m.due_operating_hours === null ||
          e.operating_hours + plan.original_hours < m.due_operating_hours) &&
        (m.due_date === null ||
          localDate(plan.collection_at, r.timezone) <= m.due_date),
    );
  return {
    eligible: limitsPass && results.every(isReady),
    results,
    conditions: [
      `Replacement ${plan.replacement_id} delivered ${plan.delivery_at}; handoff ${plan.handoff}; collect original ${plan.collection_at}. Downtime ${plan.downtime_hours} hours. ${plan.instructions} No additional pickup or delivery charge; agreed rental charge applies.`,
    ],
  };
}
export function selection(
  state: RentalState,
  r: RentalRequest,
  now: string,
): { results: RentalEvaluation[]; conditions: string[] } {
  const swap = state.swap_plans.find((p) => p.request_id === r.request_id);
  if (swap) {
    const result = evaluateSwap(state, r, swap, now);
    if (!result.eligible)
      throw new Error(
        "Replacement plan is not eligible; reevaluate both units and logistics",
      );
    return result;
  }
  const active = state.allocations.filter(
    (a) =>
      a.request_id === r.request_id &&
      (a.status === "Confirmed" ||
        (a.status === "Temporary" && timestamp(a.expires_at) > timestamp(now))),
  );
  const proposal = active[0]
    ? evaluateRental(state, r, active[0].equipment_id, now)
    : proposeEquipment(state, r, now).proposal;
  if (!proposal || !isReady(proposal))
    throw new Error(
      "No qualifying equipment; resolve blockers or arrange callback",
    );
  return { results: [proposal], conditions: proposal.conditions };
}
function approvalScope(
  state: RentalState,
  r: RentalRequest,
  now: string,
): string {
  const s = selection(state, r, now);
  return JSON.stringify({
    request: r,
    equipment: s.results.map((x) => x.equipment_id),
    conditions: s.conditions,
    plans: state.service_plans.filter((p) => p.request_id === r.request_id),
    swap: state.swap_plans.filter((p) => p.request_id === r.request_id),
  });
}
type Common = { actor: string; reason: string; evidence: string };
export type WorkflowCommand =
  | (Common & {
      type:
        | "Allocate"
        | "Approve proposal"
        | "Accept"
        | "Cancel"
        | "Decline conditions";
      request_id: string;
      accept_conditions?: boolean;
    })
  | (Common & {
      type: "Place hold";
      equipment_id: string;
      task_id: string;
      authority: "Mechanic" | "Manager";
    })
  | (Common & { type: "Complete work"; maintenance_id: string })
  | (Common & {
      type: "Pass inspection";
      equipment_id: string;
      valid_until: string;
      next_due_hours: number;
    })
  | (Common & { type: "Reconcile"; equipment_id: string })
  | (Common & { type: "Release hold"; hold_id: string })
  | (Common & {
      type: "Approve delay";
      request_id: string;
      maintenance_id: string;
      service_at: string;
      service_meter: number;
    })
  | (Common & {
      type: "Update customer checks";
      customer_id: string;
      route: "Existing" | "New" | "Uncertain";
      identity: "Verified" | "Pending" | "Failed";
      profile: "Verified" | "Pending" | "Failed";
      billing: "Verified" | "Pending" | "Failed";
      insurance_on_site: "Verified" | "Pending" | "Failed";
      insurance_transport: "Verified" | "Pending" | "Failed";
    })
  | (Common & { type: "Update request"; request: RentalRequest })
  | (Common & {
      type: "Record service plan";
      plan: RentalState["service_plans"][number];
    })
  | (Common & { type: "Record swap"; plan: SwapPlan })
  | (Common & {
      type: "Callback";
      request_id: string;
      equipment_id: string;
      update_at: string;
      question: string;
    })
  | (Common & {
      type: "Review callback" | "Record customer update";
      callback_id: string;
      result: string;
      review_status?: "Incomplete" | "Confirmed plan" | "Denied" | "Complete";
    });

/** In-memory simulation. All writes pass role/evidence gates and are atomic on failure. */
export function applyWorkflow(
  state: RentalState,
  cmd: WorkflowCommand,
  now: string,
): RentalState {
  timestamp(now);
  if (!cmd.reason.trim() || !evidencePresent(cmd.evidence))
    throw new Error("Reason and supporting evidence are required");
  const next = expireAllocations(state, now),
    d = next.dataset;
  let equipment = "",
    reference = "",
    scope = "";
  const record = (action: string) => {
    const decision: Decision = {
      decision_id: "DEC-" + (next.decisions.length + 1),
      actor: cmd.actor,
      timestamp: now,
      equipment_id: equipment,
      reference,
      action,
      reason: cmd.reason,
      evidence: cmd.evidence,
      scope,
    };
    next.decisions.push(decision);
  };
  const request = (id: string) => {
    const r = d.rental_workflow.rental_requests.find(
      (r) => r.request_id === id,
    );
    if (!r) throw new Error("Unknown rental request");
    scope = requestScope(r);
    reference = id;
    return r;
  };
  if (
    [
      "Allocate",
      "Approve proposal",
      "Accept",
      "Cancel",
      "Decline conditions",
    ].includes(cmd.type)
  ) {
    const c = cmd as Extract<
      WorkflowCommand,
      {
        type:
          | "Allocate"
          | "Approve proposal"
          | "Accept"
          | "Cancel"
          | "Decline conditions";
      }
    >;
    staff(next, c.actor, ["Customer Service"]);
    const r = request(c.request_id);
    const draft = next.drafts[r.request_id] ?? {
      status: "Draft",
      approved_scope: "",
      accepted_scope: "",
      conditions_scope: "",
    };
    if (draft.status === "Confirmed")
      throw new Error(
        "Confirmed rental requires the separate cancellation/change process",
      );
    if (c.type === "Decline conditions") {
      const selected = selection(next, r, now);
      if (!selected.conditions.length)
        throw new Error("No customer-facing conditions to decline");
      equipment = selected.results.map((x) => x.equipment_id).join(", ");
      for (const a of next.allocations.filter(
        (a) => a.request_id === r.request_id && a.status === "Temporary",
      ))
        a.status = "Canceled";
      next.swap_plans = next.swap_plans.filter(
        (p) => p.request_id !== r.request_id,
      );
      draft.approved_scope = "";
      draft.accepted_scope = "";
      draft.conditions_scope = "";
    } else if (c.type === "Cancel") {
      draft.status = "Canceled";
      for (const a of next.allocations.filter(
        (a) => a.request_id === r.request_id && a.status === "Temporary",
      ))
        a.status = "Canceled";
    } else {
      if (draft.status === "Canceled")
        throw new Error("Canceled agreement cannot be accepted");
      const selected = selection(next, r, now);
      equipment = selected.results.map((x) => x.equipment_id).join(", ");
      if (c.type === "Allocate") {
        if (timestamp(r.pickup) <= timestamp(now))
          throw new Error("A new allocation requires a future pickup time");
        const newScope = approvalScope(next, r, now);
        // Existing protection stays until an eligible replacement is atomically allocated.
        for (const a of next.allocations.filter(
          (a) => a.request_id === r.request_id && a.status === "Temporary",
        ))
          a.status = "Canceled";
        for (const result of selected.results) {
          next.allocations.push({
            allocation_id: "ALLOC-" + (next.allocations.length + 1),
            request_id: r.request_id,
            equipment_id: result.equipment_id,
            protected_start: result.protected_start,
            protected_end: result.protected_end,
            status: "Temporary",
            created_at: now,
            expires_at: new Date(timestamp(now) + 4 * 3600000).toISOString(),
            scope: newScope,
          });
        }
        draft.approved_scope = "";
        draft.accepted_scope = "";
        draft.conditions_scope = "";
      } else {
        const selectedScope = approvalScope(next, r, now);
        const active = next.allocations.filter(
          (a) =>
            a.request_id === r.request_id &&
            a.status === "Temporary" &&
            timestamp(a.expires_at) > timestamp(now) &&
            a.scope === selectedScope,
        );
        if (
          selected.results.some(
            (result) =>
              !active.some(
                (a) =>
                  a.equipment_id === result.equipment_id &&
                  a.protected_start === result.protected_start &&
                  a.protected_end === result.protected_end,
              ),
          )
        )
          throw new Error(
            "Reevaluate and acquire current temporary allocations before approval or acceptance",
          );
        if (c.type === "Approve proposal") draft.approved_scope = selectedScope;
        else {
          const pending = customerGate(next, r);
          if (pending.length)
            throw new Error(
              "Required checks block confirmation: " + pending.join("; "),
            );
          if (draft.approved_scope !== selectedScope)
            throw new Error("Current staff approval is required");
          if (selected.conditions.length && !c.accept_conditions)
            throw new Error(
              "Customer acceptance of all current conditions is required",
            );
          draft.accepted_scope = selectedScope;
          draft.conditions_scope = selected.conditions.length
            ? selectedScope
            : "";
          draft.status = "Confirmed";
          for (const a of active) a.status = "Confirmed";
        }
      }
    }
    next.drafts[r.request_id] = draft;
  } else if (cmd.type === "Place hold") {
    staff(next, cmd.actor, ["Mechanic", "Manager"]);
    if (!d.equipment.some((e) => e.equipment_id === cmd.equipment_id))
      throw new Error("Unknown equipment");
    equipment = cmd.equipment_id;
    reference = "HOLD-DEMO-" + (d.rental_workflow.holds.length + 1);
    d.rental_workflow.holds.push({
      hold_id: reference,
      equipment_id: equipment,
      task_id: cmd.task_id,
      authority: cmd.authority,
      reason: cmd.reason,
      evidence: cmd.evidence,
      active: true,
    });
  } else if (cmd.type === "Complete work") {
    const m = d.maintenance.find(
        (m) => m.maintenance_id === cmd.maintenance_id,
      ),
      c = d.rental_workflow.maintenance_controls.find(
        (c) => c.maintenance_id === cmd.maintenance_id,
      );
    if (!m || !c) throw new Error("Missing work assessment");
    staff(next, cmd.actor, ["Mechanic"], c.policy_id);
    staff(next, cmd.actor, ["Mechanic"], "maintenance:" + m.maintenance_id);
    equipment = m.equipment_id;
    reference = m.maintenance_id;
    m.status = "Complete";
    m.evidence_reference = cmd.evidence;
    if (
      c.criticality !== "Noncritical" &&
      !d.rental_workflow.holds.some(
        (h) =>
          h.equipment_id === equipment && h.task_id === reference && h.active,
      )
    )
      d.rental_workflow.holds.push({
        hold_id: "HOLD-DEMO-" + (d.rental_workflow.holds.length + 1),
        equipment_id: equipment,
        task_id: reference,
        authority: "Mechanic",
        reason: "Post-work inspection and routine release required",
        evidence: cmd.evidence,
        active: true,
      });
  } else if (cmd.type === "Pass inspection") {
    staff(next, cmd.actor, ["Mechanic", "Inspector"], "safety-inspection");
    const e = d.equipment.find((e) => e.equipment_id === cmd.equipment_id);
    if (!e) throw new Error("Unknown equipment");
    staff(
      next,
      cmd.actor,
      ["Mechanic", "Inspector"],
      "inspection:" + e.equipment_type,
    );
    if (
      d.maintenance.some(
        (m) =>
          m.equipment_id === e.equipment_id &&
          m.trigger_type === "Condition" &&
          !isComplete(m.status),
      )
    )
      throw new Error("Blocking defect work remains incomplete");
    const day = localDate(now, d.metadata.source_timezone);
    if (
      cmd.valid_until < day ||
      !/^\d{4}-\d\d-\d\d$/.test(cmd.valid_until) ||
      !Number.isFinite(cmd.next_due_hours) ||
      cmd.next_due_hours <= e.operating_hours
    )
      throw new Error("Inspection validity and future hour limit required");
    equipment = e.equipment_id;
    reference = "INSP-DEMO-" + (d.inspections.length + 1);
    d.inspections.push({
      inspection_id: reference,
      equipment_id: equipment,
      inspection_type: "Post-rental safety inspection",
      required_after_each_rental: true,
      inspection_date: day,
      related_rental_id: null,
      result: "Passed",
      defects_found: "None",
      corrective_work_reference: null,
      valid_until: cmd.valid_until,
      next_due_hours: cmd.next_due_hours,
      performed_by_role: staff(next, cmd.actor, ["Mechanic", "Inspector"]).role,
      evidence_reference: cmd.evidence,
    });
  } else if (cmd.type === "Reconcile") {
    staff(next, cmd.actor, ["Manager"]);
    equipment = cmd.equipment_id;
    reference = equipment;
    const e = d.equipment.find((e) => e.equipment_id === equipment);
    if (!e) throw new Error("Unknown equipment");
    const supported = next.decisions.some(
      (x) =>
        x.equipment_id === equipment &&
        ["Complete work", "Pass inspection"].includes(x.action) &&
        d.rental_workflow.staff.some(
          (s) =>
            s.staff_id === x.actor &&
            ["Mechanic", "Inspector"].includes(s.role),
        ),
    );
    if (!supported)
      throw new Error(
        "Technical completion/inspection evidence is required for reconciliation",
      );
    e.current_status = "Equipment Ready";
    e.current_condition = "Good";
    e.record_updated = localDate(now, d.metadata.source_timezone);
    if (
      evaluateEquipmentReadiness(
        d,
        equipment,
        localDate(now, d.metadata.source_timezone),
      ).readiness_outcome !== "Equipment Ready"
    )
      throw new Error("Required equipment controls still fail");
  } else if (cmd.type === "Release hold") {
    const h = d.rental_workflow.holds.find(
      (h) => h.hold_id === cmd.hold_id && h.active,
    );
    if (!h) throw new Error("Unknown active hold");
    equipment = h.equipment_id;
    reference = h.hold_id;
    const control = d.rental_workflow.maintenance_controls.find(
      (c) => c.maintenance_id === h.task_id,
    );
    if (h.authority === "Mechanic" && control)
      staff(next, cmd.actor, ["Mechanic"], "maintenance:" + h.task_id);
    staff(
      next,
      cmd.actor,
      h.authority === "Manager" ? ["Manager"] : ["Mechanic"],
      h.authority === "Mechanic"
        ? (control?.policy_id ?? "safety-inspection")
        : undefined,
    );
    const e = d.equipment.find((e) => e.equipment_id === equipment)!;
    if (
      h.authority === "Mechanic" &&
      d.rental_workflow.holds.some(
        (other) =>
          other.active &&
          other.equipment_id === equipment &&
          other.authority === "Manager",
      )
    )
      throw new Error("Separate Manager hold remains");
    if (
      control &&
      !d.maintenance.some(
        (m) => m.maintenance_id === h.task_id && isComplete(m.status),
      )
    )
      throw new Error("Held work remains incomplete");
    const work = next.decisions
      .filter((x) => x.reference === h.task_id && x.action === "Complete work")
      .at(-1);
    if (
      control &&
      work &&
      !next.decisions.some(
        (x) =>
          x.equipment_id === equipment &&
          x.action === "Pass inspection" &&
          timestamp(x.timestamp) >= timestamp(work.timestamp),
      )
    )
      throw new Error("Required post-work inspection evidence is missing");
    // Routine pending statuses may be reconciled by the qualified mechanic only after work/checks pass.
    if (
      h.authority === "Mechanic" &&
      ["Inspection Pending", "Maintenance Scheduled"].includes(e.current_status)
    ) {
      e.current_status = "Equipment Ready";
      e.current_condition = "Good";
    }
    if (
      evaluateEquipmentReadiness(
        d,
        equipment,
        localDate(now, d.metadata.source_timezone),
      ).readiness_outcome !== "Equipment Ready"
    )
      throw new Error(
        "Required work, checks or contradictory evidence still block release",
      );
    if (
      !next.decisions.some(
        (x) =>
          x.equipment_id === equipment &&
          ["Complete work", "Pass inspection"].includes(x.action),
      )
    )
      throw new Error("Recorded technical completion evidence required");
    h.active = false;
  } else if (cmd.type === "Approve delay") {
    staff(next, cmd.actor, ["Manager"]);
    const r = request(cmd.request_id),
      m = d.maintenance.find((m) => m.maintenance_id === cmd.maintenance_id);
    if (!m) throw new Error("Unknown task");
    equipment = m.equipment_id;
    reference = m.maintenance_id;
    if (
      timestamp(cmd.service_at) < timestamp(r.return_at) ||
      !delayPermitted(
        next,
        r,
        equipment,
        reference,
        cmd.service_at,
        cmd.service_meter,
      )
    )
      throw new Error(
        "Delay exceeds policy, task or warranty limits, or evidence is incomplete",
      );
    next.delay_approvals = next.delay_approvals.filter(
      (a) => !(a.maintenance_id === reference && a.request_scope === scope),
    );
    next.delay_approvals.push({
      maintenance_id: reference,
      request_scope: scope,
      actor: cmd.actor,
      timestamp: now,
      service_at: cmd.service_at,
      service_meter: cmd.service_meter,
      evidence: cmd.evidence,
    });
  } else if (cmd.type === "Update customer checks") {
    staff(next, cmd.actor, ["Customer Service"]);
    const c = d.rental_workflow.customer_checks.find(
      (c) => c.customer_id === cmd.customer_id,
    );
    if (!c) throw new Error("Unknown customer");
    reference = cmd.customer_id;
    Object.assign(c, {
      route: cmd.route,
      identity: cmd.identity,
      profile: cmd.profile,
      billing: cmd.billing,
      insurance_on_site: cmd.insurance_on_site,
      insurance_transport: cmd.insurance_transport,
      evidence: cmd.evidence,
    });
  } else if (cmd.type === "Update request") {
    staff(next, cmd.actor, ["Customer Service"]);
    const index = d.rental_workflow.rental_requests.findIndex(
      (r) => r.request_id === cmd.request.request_id,
    );
    if (
      index < 0 ||
      next.drafts[cmd.request.request_id]?.status === "Confirmed"
    )
      throw new Error("Unknown or confirmed request");
    d.rental_workflow.rental_requests[index] = structuredClone(cmd.request);
    reference = cmd.request.request_id;
    scope = requestScope(cmd.request);
    if (next.drafts[reference]) {
      next.drafts[reference].approved_scope = "";
      next.drafts[reference].accepted_scope = "";
      next.drafts[reference].conditions_scope = "";
    }
  } else if (cmd.type === "Record service plan") {
    staff(next, cmd.actor, ["Mechanic"]);
    equipment = cmd.plan.equipment_id;
    reference = cmd.plan.plan_id;
    request(cmd.plan.request_id);
    const control = d.rental_workflow.maintenance_controls.find(
      (c) => c.maintenance_id === cmd.plan.maintenance_id,
    );
    if (!control) throw new Error("Missing work assessment");
    staff(next, cmd.actor, ["Mechanic"], control.policy_id);
    staff(
      next,
      cmd.actor,
      ["Mechanic"],
      "maintenance:" + control.maintenance_id,
    );
    timestamp(cmd.plan.start);
    timestamp(cmd.plan.end);
    next.service_plans = next.service_plans.filter(
      (p) => p.plan_id !== cmd.plan.plan_id,
    );
    next.service_plans.push({ ...cmd.plan, evidence: cmd.evidence });
  } else if (cmd.type === "Record swap") {
    staff(next, cmd.actor, ["Manager"]);
    const r = request(cmd.plan.request_id),
      p = {
        ...cmd.plan,
        approved_by: cmd.actor,
        request_scope: requestScope(r),
        evidence: cmd.evidence,
      };
    if (!evaluateSwap(next, r, p, now).eligible)
      throw new Error(
        "Both units, service limits and replacement logistics must qualify",
      );
    equipment = p.original_id + ", " + p.replacement_id;
    reference = p.plan_id;
    next.swap_plans = next.swap_plans.filter(
      (p) => p.request_id !== r.request_id,
    );
    next.swap_plans.push(p);
    if (next.drafts[r.request_id])
      next.drafts[r.request_id].approved_scope = "";
  } else if (cmd.type === "Callback") {
    staff(next, cmd.actor, ["Customer Service"]);
    const r = request(cmd.request_id);
    if (
      timestamp(cmd.update_at) <= timestamp(now) ||
      !cmd.question.trim() ||
      !r.intake.contact
    )
      throw new Error(
        "Callback contact, future update time and question required",
      );
    if (proposeEquipment(next, r, now).proposal)
      throw new Error("Qualifying option exists; present it before callback");
    const result = evaluateRental(next, r, cmd.equipment_id, now);
    equipment = cmd.equipment_id;
    reference = "CALL-" + (next.callbacks.length + 1);
    const reviewer = result.findings.some((f) => f.reviewer === "Manager")
      ? "Manager"
      : result.findings.some((f) => f.reviewer === "Mechanic")
        ? "Mechanic"
        : "Customer Service";
    next.callbacks.push({
      callback_id: reference,
      request_id: r.request_id,
      equipment_id: equipment,
      contact: r.intake.contact,
      update_at: cmd.update_at,
      reviewer,
      owner: cmd.actor,
      question: cmd.question,
      review_result: "Pending",
      review_status: "Pending",
      request_scope: requestScope(r),
      customer_update: "",
      status: "Open",
    });
  } else if (
    cmd.type === "Review callback" ||
    cmd.type === "Record customer update"
  ) {
    const cb = next.callbacks.find(
      (cb) => cb.callback_id === cmd.callback_id && cb.status === "Open",
    );
    if (!cb || !cmd.result.trim())
      throw new Error("Open callback and recorded result required");
    equipment = cb.equipment_id;
    reference = cb.callback_id;
    if (cmd.type === "Review callback") {
      staff(next, cmd.actor, [cb.reviewer]);
      cb.review_result = cmd.result;
      cb.review_status = cmd.review_status ?? "Incomplete";
    } else {
      staff(next, cmd.actor, ["Customer Service"]);
      if (cb.owner !== cmd.actor)
        throw new Error("Assigned Customer Service owner must record update");
      cb.customer_update = cmd.result;
      cb.status = "Closed";
    }
  }
  record(cmd.type);
  validateRentalDataset(d);
  return next;
}
