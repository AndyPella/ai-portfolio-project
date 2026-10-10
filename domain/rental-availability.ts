import {
  evaluateEquipmentReadiness,
  type EquipmentReadinessResult,
} from "./equipment-readiness.ts";
import { localDate, timestamp, validateRequest } from "./rental-validation.ts";
import {
  requestScope,
  type RentalRequest,
  type RentalState,
  type Role,
  type MaintenanceControl,
} from "./rental-records.ts";

export const RENTAL_OUTCOMES = [
  "Not Available",
  "Remediation Required",
  "Human Review Required",
  "Rental Ready with Conditions",
  "Rental Ready",
] as const;
export type RentalOutcome = (typeof RENTAL_OUTCOMES)[number];
export interface Finding {
  code: string;
  outcome: RentalOutcome;
  message: string;
  reference: string;
  evidence: string;
  reviewer: Role | null;
  action: string;
}
export interface RentalEvaluation {
  equipment_id: string;
  request_id: string;
  current: EquipmentReadinessResult;
  outcome: RentalOutcome;
  findings: Finding[];
  conditions: string[];
  interruption_hours: number;
  protected_start: string;
  protected_end: string;
  forecast: string;
  expected_completion: string | null;
  summary: string;
  evaluated_at: string;
  in_time: boolean;
}
const HOUR = 3600000;
export const isReady = (r: RentalEvaluation) =>
  r.outcome === "Rental Ready" || r.outcome === "Rental Ready with Conditions";
export const overlaps = (a: number, b: number, c: number, d: number) =>
  a < d && c < b;
export const isComplete = (s: string) =>
  ["closed", "complete", "completed", "resolved"].includes(s.toLowerCase());
export const evidencePresent = (value: string) =>
  !!value?.trim() &&
  !["missing", "unknown", "none", "n/a"].includes(value.trim().toLowerCase());
export function classifyFailure(
  cause:
    | "Normal intended operation"
    | "Misuse"
    | "Delivery damage"
    | "Pickup damage"
    | "Unknown",
): string {
  return cause === "Normal intended operation"
    ? "Operational Failure"
    : cause === "Unknown"
      ? "Cause requires qualified assessment"
      : "Excluded from Operational Failure";
}
export function protectedInterval(r: RentalRequest): [number, number] {
  return [
    timestamp(r.pickup) - Math.max(2, r.preparation_hours) * HOUR,
    timestamp(r.return_at) + Math.max(2, r.turnaround_hours) * HOUR,
  ];
}
export function hoursBefore(r: RentalRequest, at: string): number | null {
  if (timestamp(at) <= timestamp(r.pickup)) return 0;
  if (timestamp(at) >= timestamp(r.return_at)) return r.total_hours;
  if (!r.usage.length) return null;
  let sum = 0;
  for (const w of r.usage) {
    if (timestamp(w.end) <= timestamp(at)) sum += w.hours;
    else if (timestamp(w.start) < timestamp(at)) return null;
  }
  return sum;
}
export function delayLimits(
  state: RentalState,
  c: MaintenanceControl,
): { days: number; hours: number } | null {
  const p = state.dataset.rental_workflow.policies.find(
    (p) =>
      p.policy_id === c.policy_id &&
      p.version === c.policy_version &&
      p.system_group === c.system_group,
  );
  const assessor = state.dataset.rental_workflow.staff.find(
    (s) =>
      s.staff_id === c.assessed_by &&
      s.role === "Mechanic" &&
      s.qualifications.includes(c.policy_id) &&
      s.qualifications.includes("maintenance:" + c.maintenance_id),
  );
  if (
    !p ||
    !assessor ||
    !evidencePresent(c.assessment_evidence) ||
    c.criticality !== "Noncritical" ||
    c.delay_gate !== "Delay Permitted Within Policy" ||
    c.warranty_status === "Unknown" ||
    !evidencePresent(c.warranty_reference)
  )
    return null;
  if (
    c.warranty_status === "Covered" &&
    (c.warranty_max_days === null || c.warranty_max_hours === null)
  )
    return null;
  return {
    days: Math.min(
      p.max_days,
      c.task_max_days ?? Infinity,
      c.warranty_max_days ?? Infinity,
    ),
    hours: Math.min(
      p.max_hours,
      c.task_max_hours ?? Infinity,
      c.warranty_max_hours ?? Infinity,
    ),
  };
}
function dueDateForHours(
  r: RentalRequest,
  current: number,
  due: number,
): string | null {
  if (current >= due) return null;
  let used = 0;
  for (const w of r.usage) {
    used += w.hours;
    if (current + used >= due) return localDate(w.start, r.timezone);
  }
  return null;
}
export function delayPermitted(
  state: RentalState,
  r: RentalRequest,
  equipmentId: string,
  maintenanceId: string,
  serviceAt: string,
  serviceMeter: number,
): boolean {
  const m = state.dataset.maintenance.find(
    (m) => m.maintenance_id === maintenanceId && m.equipment_id === equipmentId,
  );
  const c = state.dataset.rental_workflow.maintenance_controls.find(
    (c) => c.maintenance_id === maintenanceId,
  );
  const e = state.dataset.equipment.find((e) => e.equipment_id === equipmentId);
  if (
    !m ||
    !c ||
    !e ||
    !Number.isFinite(serviceMeter) ||
    serviceMeter < e.operating_hours + r.total_hours
  )
    return false;
  const limits = delayLimits(state, c);
  if (!limits || m.trigger_type === "Condition") return false;
  const dueDay =
    m.due_date ??
    (m.due_operating_hours === null
      ? null
      : dueDateForHours(r, e.operating_hours, m.due_operating_hours));
  // Without a documented threshold day, the calendar part of a delay cannot be proved.
  if (!dueDay) return false;
  const dayDiff =
    (Date.parse(localDate(serviceAt, r.timezone) + "T00:00:00Z") -
      Date.parse(dueDay + "T00:00:00Z")) /
    86400000;
  return (
    dayDiff >= 0 &&
    dayDiff <= limits.days &&
    (m.due_operating_hours === null ||
      serviceMeter - m.due_operating_hours <= limits.hours)
  );
}

/** All findings survive precedence. Future completion never changes current readiness. */
export function evaluateRental(
  state: RentalState,
  r: RentalRequest,
  equipmentId: string,
  now: string,
): RentalEvaluation {
  validateRequest(r);
  const nowMs = timestamp(now),
    d = state.dataset;
  const e = d.equipment.find((e) => e.equipment_id === equipmentId);
  if (!e) throw new Error("Unknown equipment");
  const today = localDate(now, r.timezone);
  // Apply evidenced, request-specific noncritical deferral limits to the readiness calculation.
  // Original due records remain unchanged and are retained in the staff findings.
  const allowedDelays = state.delay_approvals.filter(
    (a) =>
      a.request_scope === requestScope(r) &&
      timestamp(a.service_at) > nowMs &&
      evidencePresent(a.evidence) &&
      d.rental_workflow.staff.some(
        (s) => s.staff_id === a.actor && s.role === "Manager",
      ) &&
      delayPermitted(
        state,
        r,
        equipmentId,
        a.maintenance_id,
        a.service_at,
        a.service_meter,
      ),
  );
  const readinessData = allowedDelays.length
    ? {
        ...d,
        maintenance: d.maintenance.map((m) => {
          const approval = allowedDelays.find(
            (a) => a.maintenance_id === m.maintenance_id,
          );
          return approval
            ? {
                ...m,
                due_date:
                  m.due_date === null
                    ? null
                    : localDate(approval.service_at, r.timezone),
                due_operating_hours:
                  m.due_operating_hours === null
                    ? null
                    : approval.service_meter,
              }
            : m;
        }),
      }
    : d;
  const current = evaluateEquipmentReadiness(readinessData, equipmentId, today);
  const [start, end] = protectedInterval(r),
    findings: Finding[] = [],
    conditions: string[] = [];
  let interruptionHours = 0;
  const add = (
    code: string,
    outcome: RentalOutcome,
    message: string,
    reference: string,
    evidence: string,
    reviewer: Role | null,
    action: string,
  ) =>
    findings.push({
      code,
      outcome,
      message,
      reference,
      evidence,
      reviewer,
      action,
    });
  if (
    !evidencePresent(e.asset_qualification_reference) ||
    !evidencePresent(e.required_attachments)
  )
    add(
      "ASSET_EVIDENCE",
      "Human Review Required",
      "Asset qualification or attachment evidence is missing.",
      equipmentId,
      e.asset_qualification_reference,
      "Manager",
      "Reconcile qualification and required equipment records.",
    );
  if (
    (r.equipment_id && r.equipment_id !== equipmentId) ||
    e.equipment_type !== r.equipment_type ||
    !r.capabilities.every((c) => e.capabilities.split("; ").includes(c)) ||
    !r.attachments.every((c) => e.required_attachments.split("; ").includes(c))
  )
    add(
      "UNSUITABLE",
      "Not Available",
      "Required asset, type, capabilities, or attachments do not match.",
      equipmentId,
      e.asset_qualification_reference,
      "Customer Service",
      "Confirm requirements or choose an eligible alternative.",
    );
  if (e.current_location !== r.location)
    add(
      "LOCATION",
      "Not Available",
      "Equipment is at a different branch; no confirmed transfer plan.",
      equipmentId,
      e.current_location,
      "Customer Service",
      "Agree another branch or establish logistics.",
    );
  if (!r.logistics_confirmed)
    add(
      "LOGISTICS",
      "Human Review Required",
      "Access, loading or transport timing is not confirmed.",
      r.request_id,
      r.intake.notes,
      "Customer Service",
      "Validate delivery/pickup instructions.",
    );
  const reviews = state.callbacks.filter(
    (cb) =>
      cb.request_id === r.request_id &&
      cb.equipment_id === equipmentId &&
      cb.request_scope === requestScope(r),
  );
  const lastReview = state.decisions
    .toReversed()
    .find(
      (x) =>
        x.action === "Review callback" &&
        reviews.some((cb) => cb.callback_id === x.reference),
    );
  const cb =
    reviews.find((cb) => cb.callback_id === lastReview?.reference) ??
    reviews.toReversed().find((cb) => cb.review_status !== "Pending");
  if (cb?.review_status === "Denied")
    add(
      "REVIEW_DENIED",
      "Not Available",
      "Authorized review confirms this option cannot satisfy the request.",
      cb.callback_id,
      cb.review_result,
      cb.reviewer,
      "Offer a qualifying alternative or revise the request.",
    );
  if (
    state.decisions.some(
      (x) =>
        x.action === "Decline conditions" &&
        x.scope === requestScope(r) &&
        x.equipment_id.split(", ").includes(equipmentId),
    )
  )
    add(
      "CONDITIONS_DECLINED",
      "Not Available",
      "Customer declined this option's service or replacement conditions.",
      r.request_id,
      "Recorded customer decision",
      "Customer Service",
      "Evaluate a full-period alternative, revised dates or callback.",
    );
  for (const decision of state.decisions.filter(
    (x) =>
      x.equipment_id === equipmentId &&
      ["Complete work", "Pass inspection", "Release hold"].includes(x.action) &&
      timestamp(x.timestamp) > start,
  ))
    add(
      "PREPARATION_INCOMPLETE",
      "Not Available",
      "Required work/checks/release finished after preparation must begin.",
      decision.reference,
      decision.evidence,
      "Customer Service",
      "Revise pickup time and reevaluate protected buffers.",
    );
  for (const f of current.reason_codes.map((code, i) => ({ code, i })))
    if (f.code !== "ALL_CONTROLS_SATISFIED") {
      const known = [
        "FAILED_INSPECTION",
        "UNRESOLVED_BLOCKING_DEFECT",
        "REQUIRED_INSPECTION_MISSING",
        "INSPECTION_NOT_PASSED",
        "POST_RENTAL_INSPECTION_STALE",
        "INSPECTION_EXPIRED",
        "INSPECTION_HOURS_EXCEEDED",
        "CALENDAR_MAINTENANCE_DUE",
        "OPERATING_HOUR_MAINTENANCE_DUE",
      ].includes(f.code);
      add(
        f.code,
        known ? "Remediation Required" : "Human Review Required",
        current.explanations[f.i],
        current.evidence_references[f.i].record_id,
        current.evidence_references[f.i].evidence_reference ??
          e.asset_qualification_reference,
        known ? "Mechanic" : "Manager",
        known
          ? "Complete and verify required work/checks."
          : "Reconcile evidence with Mechanic support.",
      );
    }
  // The legacy readiness evaluator returns early; independently preserve known defects and all holds.
  const inspections = d.inspections
    .filter((i) => i.equipment_id === equipmentId && i.inspection_date <= today)
    .toSorted(
      (a, b) =>
        b.inspection_date.localeCompare(a.inspection_date) ||
        b.inspection_id.localeCompare(a.inspection_id),
    );
  const latest =
    inspections.find((i) => i.required_after_each_rental) ?? inspections[0];
  if (latest) {
    if (!evidencePresent(latest.evidence_reference))
      add(
        "INSPECTION_EVIDENCE",
        "Human Review Required",
        "Required inspection lacks usable supporting evidence.",
        latest.inspection_id,
        latest.evidence_reference,
        "Manager",
        "Verify the inspection evidence.",
      );
    if (
      latest.result !== "Passed" ||
      latest.inspection_date <= e.last_rental_end
    )
      add(
        "REQUIRED_CHECK",
        "Remediation Required",
        "Required safety/post-rental inspection has not passed for the latest rental.",
        latest.inspection_id,
        latest.evidence_reference,
        "Mechanic",
        "Qualified inspector must record passed checks.",
      );
    if (latest.valid_until < localDate(r.return_at, r.timezone))
      add(
        "INSPECTION_PERIOD",
        "Remediation Required",
        "Inspection does not cover the requested rental period.",
        latest.inspection_id,
        latest.evidence_reference,
        "Mechanic",
        "Record valid inspection coverage.",
      );
    if (
      latest.next_due_hours !== null &&
      e.operating_hours + r.total_hours >= latest.next_due_hours
    )
      add(
        "INSPECTION_USAGE",
        "Not Available",
        "Projected usage reaches the inspection limit; no confirmed inspection stop.",
        latest.inspection_id,
        latest.evidence_reference,
        "Mechanic",
        "Revise usage or verify an inspection plan.",
      );
    if (latest.defects_found !== "None") {
      const linked = d.maintenance.find(
        (m) =>
          m.equipment_id === equipmentId &&
          (m.maintenance_id === latest.corrective_work_reference ||
            m.evidence_reference === latest.corrective_work_reference),
      );
      if (!linked || !isComplete(linked.status))
        add(
          "DEFECT",
          "Remediation Required",
          "Unresolved defect remains blocking regardless of its cause.",
          latest.inspection_id,
          latest.evidence_reference,
          "Mechanic",
          "Repair and reinspect before release.",
        );
    }
  }
  const holds = d.rental_workflow.holds.filter(
    (h) => h.equipment_id === equipmentId && h.active,
  );
  for (const task of d.maintenance.filter(
    (m) => m.equipment_id === equipmentId && isComplete(m.status),
  )) {
    const control = d.rental_workflow.maintenance_controls.find(
      (c) => c.maintenance_id === task.maintenance_id,
    );
    if (
      control?.next_due_operating_hours !== null &&
      control?.next_due_operating_hours !== undefined &&
      e.operating_hours + r.total_hours >= control.next_due_operating_hours
    )
      add(
        "NEXT_SERVICE_LIMIT",
        "Not Available",
        "Projected use reaches the recorded next service limit after completed work; no subsequent service plan is verified.",
        task.maintenance_id,
        task.evidence_reference,
        "Mechanic",
        "Establish the next service task/stop or revise usage.",
      );
  }
  for (const h of holds)
    add(
      "ACTIVE_HOLD",
      "Remediation Required",
      h.reason,
      h.hold_id,
      h.evidence,
      h.authority,
      "Complete prerequisites and record authorized hold release.",
    );
  for (const reservation of d.reservations.filter(
    (v) =>
      v.equipment_id === equipmentId &&
      ["Confirmed", "Hold"].includes(v.status),
  )) {
    const t = d.rental_workflow.reservation_timing.find(
      (t) => t.reservation_id === reservation.reservation_id,
    );
    // Date-only source commitments are conservatively protected for whole days in their recorded offset.
    const offset = r.pickup.slice(19),
      a =
        timestamp(t?.pickup ?? reservation.start_date + "T00:00:00" + offset) -
        Math.max(2, reservation.preparation_buffer_hours) * HOUR;
    const b =
      timestamp(t?.return_at ?? reservation.end_date + "T23:59:59" + offset) +
      Math.max(2, reservation.return_buffer_hours) * HOUR;
    if (overlaps(start, end, a, b))
      add(
        "RESERVATION_CONFLICT",
        "Not Available",
        "Protected rental period overlaps an existing commitment.",
        reservation.reservation_id,
        reservation.status,
        "Customer Service",
        "Offer qualifying alternatives or revise dates.",
      );
    else if (reservation.status === "Confirmed" && a >= nowMs && b <= start)
      add(
        "INTERVENING_RENTAL",
        "Human Review Required",
        "An intervening confirmed rental can change meter hours and post-rental inspection evidence before pickup.",
        reservation.reservation_id,
        reservation.estimated_operating_hours + " projected operating hours",
        "Mechanic",
        "Validate projected service limits and post-rental checks before promising future readiness.",
      );
  }
  for (const a of state.allocations.filter(
    (a) =>
      a.equipment_id === equipmentId &&
      a.request_id !== r.request_id &&
      (a.status === "Confirmed" ||
        (a.status === "Temporary" && timestamp(a.expires_at) > nowMs)),
  )) {
    if (
      overlaps(
        start,
        end,
        timestamp(a.protected_start),
        timestamp(a.protected_end),
      )
    )
      add(
        "ALLOCATION_CONFLICT",
        "Not Available",
        "Another draft or confirmed allocation protects this period.",
        a.allocation_id,
        a.status,
        "Customer Service",
        "Recheck alternatives.",
      );
  }
  for (const m of d.maintenance.filter(
    (m) => m.equipment_id === equipmentId && !isComplete(m.status),
  )) {
    if (!evidencePresent(m.evidence_reference))
      add(
        "MAINTENANCE_EVIDENCE",
        "Human Review Required",
        "Maintenance lacks usable supporting evidence.",
        m.maintenance_id,
        m.evidence_reference,
        "Manager",
        "Reconcile the work evidence.",
      );
    const c = d.rental_workflow.maintenance_controls.find(
      (c) => c.maintenance_id === m.maintenance_id,
    );
    if (m.trigger_type === "Condition")
      add(
        "REPAIR_OPEN",
        "Remediation Required",
        "Blocking condition work remains incomplete.",
        m.maintenance_id,
        m.evidence_reference,
        "Mechanic",
        "Complete repair, required inspection and release.",
      );
    const projected =
      (m.due_date !== null &&
        m.due_date <= localDate(r.return_at, r.timezone)) ||
      (m.due_operating_hours !== null &&
        e.operating_hours + r.total_hours >= m.due_operating_hours) ||
      m.trigger_type === "Condition";
    const plan = state.service_plans.find(
      (p) =>
        p.request_id === r.request_id &&
        p.equipment_id === equipmentId &&
        p.maintenance_id === m.maintenance_id,
    );
    const serviceStart = plan?.start ?? m.scheduled_start,
      serviceEnd = plan?.end ?? m.scheduled_end;
    if (
      serviceStart &&
      serviceEnd &&
      m.operational_interruption === "Full outage" &&
      overlaps(
        timestamp(r.pickup),
        timestamp(r.return_at),
        timestamp(serviceStart),
        timestamp(serviceEnd),
      )
    )
      add(
        "FACILITY_OUTAGE",
        "Not Available",
        "Full-outage work overlaps the rental.",
        m.maintenance_id,
        m.evidence_reference,
        "Mechanic",
        "Finish before preparation or choose another unit.",
      );
    const scheduledInterruption =
      serviceStart &&
      serviceEnd &&
      m.operational_interruption !== "No interruption" &&
      overlaps(
        timestamp(r.pickup),
        timestamp(r.return_at),
        timestamp(serviceStart),
        timestamp(serviceEnd),
      );
    if (!projected && !scheduledInterruption) continue;
    if (
      !c ||
      c.criticality === "Unclassified" ||
      c.delay_gate === "Human Review Required" ||
      !evidencePresent(c.assessment_evidence) ||
      !d.rental_workflow.staff.some(
        (s) =>
          s.staff_id === c.assessed_by &&
          s.role === "Mechanic" &&
          s.qualifications.includes(c.policy_id) &&
          s.qualifications.includes("maintenance:" + c.maintenance_id),
      )
    ) {
      add(
        "CLASSIFICATION",
        "Human Review Required",
        "Service classification or qualified assessment is missing.",
        m.maintenance_id,
        m.evidence_reference,
        "Mechanic",
        "Classify work and provide assessment evidence.",
      );
      continue;
    }
    const policy = d.rental_workflow.policies.find(
      (p) =>
        p.policy_id === c.policy_id &&
        p.version === c.policy_version &&
        p.system_group === c.system_group,
    );
    if (
      !policy ||
      c.warranty_status === "Unknown" ||
      !evidencePresent(c.warranty_reference)
    ) {
      add(
        "POLICY_WARRANTY",
        "Human Review Required",
        "Applicable policy/version or warranty evidence is missing.",
        m.maintenance_id,
        c.warranty_reference,
        "Manager",
        "Resolve authoritative policy and warranty limits.",
      );
      continue;
    }
    if (m.trigger_type === "Condition") continue; // Existing repair is remediation, unless a known schedule conflict proves unavailability.
    const approval = state.delay_approvals.find(
      (a) =>
        a.maintenance_id === m.maintenance_id &&
        a.request_scope === requestScope(r) &&
        d.rental_workflow.staff.some(
          (s) => s.staff_id === a.actor && s.role === "Manager",
        ) &&
        a.evidence,
    );
    if (
      approval &&
      timestamp(approval.service_at) >= timestamp(r.return_at) &&
      delayPermitted(
        state,
        r,
        equipmentId,
        m.maintenance_id,
        approval.service_at,
        approval.service_meter,
      )
    ) {
      add(
        "APPROVED_INTERNAL_DELAY",
        "Rental Ready",
        "Noncritical delay is approved within policy, task and warranty limits.",
        m.maintenance_id,
        approval.evidence,
        null,
        "Keep internal service detail available.",
      );
      continue;
    }
    const before = serviceStart ? hoursBefore(r, serviceStart) : null;
    const withinHours =
      m.due_operating_hours === null ||
      e.operating_hours + r.total_hours < m.due_operating_hours ||
      (before !== null && e.operating_hours + before <= m.due_operating_hours);
    const withinDate =
      m.due_date === null ||
      (serviceStart !== null &&
        localDate(serviceStart, r.timezone) <= m.due_date);
    const capability = d.service_capabilities.find(
      (s) =>
        s.equipment_type === e.equipment_type &&
        (s.work_type === m.maintenance_type ||
          s.work_type === "Routine maintenance"),
    );
    const qualified =
      capability &&
      d.rental_workflow.staff.some(
        (s) =>
          s.staff_id === c.assessed_by &&
          s.role === "Mechanic" &&
          s.qualifications.includes(capability.required_certification),
      );
    const scheduleConfirmed =
      serviceStart &&
      serviceEnd &&
      timestamp(serviceStart) < timestamp(serviceEnd) &&
      (timestamp(serviceEnd) - timestamp(serviceStart)) / HOUR >=
        m.estimated_duration_hours &&
      m.parts_confirmed &&
      m.technician_confirmed &&
      qualified &&
      (!plan || (plan.confirmed && plan.logistics_confirmed && plan.evidence));
    if (scheduleConfirmed && timestamp(serviceEnd!) <= start) {
      add(
        "PRE_RENTAL_WORK",
        "Remediation Required",
        "Confirmed work must still finish and be verified before preparation.",
        m.maintenance_id,
        m.evidence_reference,
        "Mechanic",
        "Complete, inspect and release; forecast is provisional.",
      );
      continue;
    }
    const during =
      serviceStart &&
      serviceEnd &&
      timestamp(serviceStart) >= timestamp(r.pickup) &&
      timestamp(serviceEnd) <= timestamp(r.return_at);
    const noOverlap =
      serviceStart &&
      serviceEnd &&
      !r.usage.some((w) =>
        overlaps(
          timestamp(w.start),
          timestamp(w.end),
          timestamp(serviceStart),
          timestamp(serviceEnd),
        ),
      );
    const customer = d.customer_requirements.find(
      (c) => c.customer_id === r.customer_id,
    );
    const access = customer?.access_windows.split("-");
    const startClock = serviceStart?.slice(11, 16),
      endClock = serviceEnd?.slice(11, 16);
    const withinAccess =
      access?.length === 2 &&
      startClock! >= access[0] &&
      endClock! <= access[1] &&
      localDate(serviceStart!, r.timezone) ===
        localDate(serviceEnd!, r.timezone);
    const notice =
      serviceStart &&
      capability &&
      timestamp(serviceStart) - nowMs >= capability.advance_notice_hours * HOUR;
    const nextLimit =
      m.due_operating_hours === null ||
      (c.next_due_operating_hours !== null &&
        e.operating_hours + r.total_hours < c.next_due_operating_hours);
    if (serviceEnd && nowMs >= timestamp(serviceEnd) && !isComplete(m.status)) {
      add(
        "SERVICE_VERIFICATION",
        "Remediation Required",
        "The recorded service time has passed without verified completion.",
        m.maintenance_id,
        m.evidence_reference,
        "Mechanic",
        "Keep equipment stopped until completion is verified.",
      );
      continue;
    }
    if (
      during &&
      scheduleConfirmed &&
      withinHours &&
      withinDate &&
      noOverlap &&
      notice &&
      withinAccess &&
      nextLimit &&
      m.on_site_permitted &&
      capability?.permitted_on_site &&
      !capability.facility_required &&
      customer?.on_site_service_allowed &&
      m.operational_interruption !== "Full outage"
    ) {
      const condition = `Required service stop ${serviceStart} to ${serviceEnd}. Stop at the mandatory limit; resume only after verified service. ${plan?.instructions ?? m.notes}`;
      conditions.push(condition);
      interruptionHours +=
        (timestamp(serviceEnd!) - timestamp(serviceStart!)) / HOUR;
      add(
        "SERVICE_STOP",
        "Rental Ready with Conditions",
        condition,
        m.maintenance_id,
        plan?.evidence ?? m.evidence_reference,
        "Customer Service",
        "Record customer acceptance of the interruption.",
      );
      continue;
    }
    if (c.criticality === "Noncritical" && delayLimits(state, c) && !approval) {
      add(
        "DELAY_APPROVAL",
        "Human Review Required",
        "Noncritical delay needs a compliant service schedule and Manager approval.",
        m.maintenance_id,
        c.assessment_evidence,
        "Manager",
        "Approve only within all documented limits.",
      );
      continue;
    }
    const unknownUsage =
      m.due_operating_hours !== null &&
      before === null &&
      serviceStart !== null;
    add(
      unknownUsage ? "USAGE_TIMING" : "MANDATORY_LIMIT",
      unknownUsage ? "Human Review Required" : "Not Available",
      unknownUsage
        ? "Daily usage alone cannot prove a safe service clock time."
        : "No confirmed plan satisfies the service limit and rental conditions.",
      m.maintenance_id,
      m.evidence_reference,
      unknownUsage ? "Customer Service" : "Mechanic",
      unknownUsage
        ? "Record specific usage windows."
        : "Stop operation at the limit; offer repair, replacement or callback.",
    );
  }
  const outcome =
    RENTAL_OUTCOMES.find((o) => findings.some((f) => f.outcome === o)) ??
    "Rental Ready";
  const blockers = findings.filter((f) =>
    ["Remediation Required", "Human Review Required", "Not Available"].includes(
      f.outcome,
    ),
  );
  const tasks = d.maintenance.filter(
    (m) => m.equipment_id === equipmentId && !isComplete(m.status),
  );
  const completedBy = tasks
    .filter(
      (m) =>
        m.scheduled_end &&
        m.parts_confirmed &&
        m.technician_confirmed &&
        timestamp(m.scheduled_end) <= start,
    )
    .map((m) => m.scheduled_end!);
  const canForecast =
    outcome === "Remediation Required" &&
    completedBy.length > 0 &&
    blockers.every((f) =>
      [
        "ACTIVE_HOLD",
        "PRE_RENTAL_WORK",
        "CALENDAR_MAINTENANCE_DUE",
        "OPERATING_HOUR_MAINTENANCE_DUE",
        "ADVERSE_EQUIPMENT_STATE",
      ].includes(f.code),
    ) &&
    holds.every(
      (h) =>
        h.authority === "Mechanic" &&
        tasks.some(
          (m) =>
            m.maintenance_id === h.task_id &&
            m.scheduled_end &&
            timestamp(m.scheduled_end) <= start,
        ),
    );
  const expected = canForecast ? completedBy.toSorted().at(-1)! : null;
  const forecast = canForecast
    ? "Potentially available—pending work and authorized release"
    : outcome === "Not Available"
      ? "Not available for this period"
      : isReady({ outcome } as RentalEvaluation)
        ? "Eligible for requested period"
        : "Availability cannot yet be confirmed";
  const summary =
    outcome === "Rental Ready"
      ? "This unit is available for your requested dates."
      : outcome === "Rental Ready with Conditions"
        ? "This unit can cover your dates with a required service plan. Confirm customer acceptance."
        : expected
          ? `Work is expected to finish ${expected}. Availability remains pending completion and authorized release.`
          : "No qualifying unit is confirmed. Review the blocker, offer a callback, or check revised dates.";
  return {
    equipment_id: equipmentId,
    request_id: r.request_id,
    current,
    outcome,
    findings,
    conditions,
    interruption_hours: interruptionHours,
    protected_start: new Date(start).toISOString(),
    protected_end: new Date(end).toISOString(),
    forecast,
    expected_completion: expected,
    summary,
    evaluated_at: now,
    in_time:
      timestamp(r.pickup) - nowMs <= 5 * 86400000 &&
      timestamp(r.pickup) >= nowMs,
  };
}
/** Ready options first, then conditional; ties are stable by asset identifier. */
export function proposeEquipment(
  state: RentalState,
  r: RentalRequest,
  now: string,
): { proposal: RentalEvaluation | null; results: RentalEvaluation[] } {
  const results = state.dataset.equipment
    .filter(
      (e) =>
        e.equipment_type === r.equipment_type &&
        (!r.equipment_id || e.equipment_id === r.equipment_id),
    )
    .map((e) => evaluateRental(state, r, e.equipment_id, now))
    .toSorted(
      (a, b) =>
        Number(!isReady(a)) - Number(!isReady(b)) ||
        Number(a.outcome === "Rental Ready with Conditions") -
          Number(b.outcome === "Rental Ready with Conditions") ||
        a.interruption_hours - b.interruption_hours ||
        a.equipment_id.localeCompare(b.equipment_id),
    );
  return { proposal: results.find(isReady) ?? null, results };
}
