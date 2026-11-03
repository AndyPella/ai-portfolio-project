import { validateNorthstarRidgeDataset } from "../data/northstar-ridge-data.ts";
import type { RentalDataset, RentalRequest } from "./rental-records.ts";

export function timestamp(value: string): number {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d\d-\d\dT(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/.test(
      value,
    ) ||
    !Number.isFinite(Date.parse(value))
  )
    throw new Error("A valid timestamp with explicit timezone is required");
  const day = value.slice(0, 10);
  if (new Date(day + "T00:00:00Z").toISOString().slice(0, 10) !== day)
    throw new Error("Invalid calendar date");
  return Date.parse(value);
}
export function localDate(value: string | number, timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
export function validateRequest(r: RentalRequest): void {
  if (
    !r.request_id ||
    !r.customer_id ||
    !r.equipment_type ||
    !r.location ||
    !r.intended_use
  )
    throw new Error("Missing rental requirements");
  if (timestamp(r.return_at) <= timestamp(r.pickup))
    throw new Error("Return must follow pickup");
  new Intl.DateTimeFormat("en-US", { timeZone: r.timezone }).format();
  // Require the entered local wall clock to match the named branch timezone, including DST.
  for (const value of [r.pickup, r.return_at]) {
    const parts = Object.fromEntries(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: r.timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hourCycle: "h23",
      })
        .formatToParts(new Date(value))
        .map((p) => [p.type, p.value]),
    );
    if (
      value.slice(0, 19) !==
      `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
    )
      throw new Error("Rental times must match the branch timezone");
  }
  for (const n of [
    r.daily_hours,
    r.total_hours,
    r.preparation_hours,
    r.turnaround_hours,
  ])
    if (!Number.isFinite(n) || n < 0)
      throw new Error("Hours must be finite and nonnegative");
  if (
    !Array.isArray(r.capabilities) ||
    !Array.isArray(r.attachments) ||
    [...r.capabilities, ...r.attachments].some(
      (x) => typeof x !== "string" || !x.trim(),
    ) ||
    !Array.isArray(r.usage)
  )
    throw new Error(
      "Capabilities, attachments and usage must be explicit arrays",
    );
  if (
    typeof r.logistics_confirmed !== "boolean" ||
    !["Verified", "Pending", "Failed"].includes(r.site_documents)
  )
    throw new Error("Required logistics and site checks are missing");
  for (const key of [
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
    "notes",
  ])
    if (
      typeof (r.intake as unknown as Record<string, unknown>)?.[key] !==
      "string"
    )
      throw new Error("Missing shared intake field: " + key);
  if (r.daily_hours > 24) throw new Error("Daily usage exceeds 24 hours");
  const calendarDays =
    (Date.parse(localDate(r.return_at, r.timezone) + "T00:00:00Z") -
      Date.parse(localDate(r.pickup, r.timezone) + "T00:00:00Z")) /
      86400000 +
    1;
  if (
    r.total_hours >
      (timestamp(r.return_at) - timestamp(r.pickup)) / 3600000 + 0.001 ||
    r.total_hours > r.daily_hours * calendarDays + 0.001
  )
    throw new Error(
      "Total usage exceeds the rental duration or recorded daily estimate",
    );
  const windows = r.usage.toSorted(
    (a, b) => timestamp(a.start) - timestamp(b.start),
  );
  for (let i = 0; i < windows.length; i++) {
    const w = windows[i],
      duration = (timestamp(w.end) - timestamp(w.start)) / 3600000;
    if (
      !Number.isFinite(w.hours) ||
      w.hours < 0 ||
      w.hours > duration ||
      timestamp(w.start) < timestamp(r.pickup) ||
      timestamp(w.end) > timestamp(r.return_at) ||
      (i > 0 && timestamp(w.start) < timestamp(windows[i - 1].end))
    )
      throw new Error("Invalid or overlapping usage windows");
  }
  if (
    windows.length &&
    Math.abs(windows.reduce((n, w) => n + w.hours, 0) - r.total_hours) > 0.001
  )
    throw new Error("Usage windows must cover the projected operating hours");
}
export function validateRentalDataset(value: unknown): RentalDataset {
  validateNorthstarRidgeDataset(value);
  const d = value as RentalDataset,
    w = d.rental_workflow;
  if (!w) throw new Error("Missing rental workflow source");
  const ids = new Map<string, Set<string>>();
  const keys = {
    policies: "policy_id",
    maintenance_controls: "maintenance_id",
    staff: "staff_id",
    holds: "hold_id",
    customer_checks: "customer_id",
    rental_requests: "request_id",
    reservation_timing: "reservation_id",
  } as const;
  for (const [group, key] of Object.entries(keys)) {
    const rows = w[group as keyof typeof keys];
    if (!Array.isArray(rows))
      throw new Error("Missing workflow group " + group);
    const seen = new Set<string>();
    for (const row of rows) {
      const id = (row as unknown as Record<string, unknown>)[key];
      if (typeof id !== "string" || !id || seen.has(id))
        throw new Error("Invalid or duplicate " + group + " identifier");
      seen.add(id);
    }
    ids.set(group, seen);
  }
  const equipment = new Set(d.equipment.map((e) => e.equipment_id)),
    maintenance = new Set(d.maintenance.map((m) => m.maintenance_id)),
    customers = new Set(d.customer_requirements.map((c) => c.customer_id));
  for (const r of w.rental_requests) {
    validateRequest(r);
    if (r.timezone !== d.metadata.source_timezone)
      throw new Error("Request timezone must match the branch source timezone");
    if (!customers.has(r.customer_id))
      throw new Error("Unknown request customer");
  }
  for (const c of w.maintenance_controls) {
    if (!maintenance.has(c.maintenance_id))
      throw new Error("Unknown maintenance control");
    for (const field of [
      "system_group",
      "delay_gate",
      "policy_id",
      "policy_version",
      "warranty_reference",
      "assessed_by",
      "assessment_evidence",
    ])
      if (typeof (c as unknown as Record<string, unknown>)[field] !== "string")
        throw new Error("Missing maintenance control: " + field);
    if (
      ![
        "Safety-critical",
        "Operationally critical",
        "Noncritical",
        "Unclassified",
      ].includes(c.criticality) ||
      ![
        "No operation beyond service limit",
        "Delay Permitted Within Policy",
        "Human Review Required",
      ].includes(c.delay_gate) ||
      !["Covered", "Out of warranty", "Unknown"].includes(c.warranty_status)
    )
      throw new Error("Invalid maintenance classification");
    for (const n of [
      c.warranty_max_days,
      c.warranty_max_hours,
      c.task_max_days,
      c.task_max_hours,
      c.next_due_operating_hours,
    ])
      if (n !== null && (!Number.isFinite(n) || n < 0))
        throw new Error("Invalid maintenance limit");
  }
  for (const p of w.policies)
    if (
      !p.version ||
      !p.system_group ||
      !p.fictional ||
      !Number.isFinite(p.max_days) ||
      !Number.isFinite(p.max_hours) ||
      p.max_days < 0 ||
      p.max_hours < 0
    )
      throw new Error("Invalid fictional policy limits");
  for (const s of w.staff)
    if (
      ![
        "Customer Service",
        "Mechanic",
        "Inspector",
        "Manager",
        "General Staff",
      ].includes(s.role) ||
      !Array.isArray(s.qualifications) ||
      s.qualifications.some((q) => typeof q !== "string")
    )
      throw new Error("Invalid staff authority");
  for (const h of w.holds)
    if (
      !equipment.has(h.equipment_id) ||
      !["Mechanic", "Manager"].includes(h.authority) ||
      typeof h.active !== "boolean" ||
      !h.evidence
    )
      throw new Error("Invalid operational hold");
  for (const c of w.customer_checks)
    if (
      !customers.has(c.customer_id) ||
      !["Existing", "New", "Uncertain"].includes(c.route) ||
      [
        c.identity,
        c.profile,
        c.billing,
        c.insurance_on_site,
        c.insurance_transport,
      ].some((x) => !["Verified", "Pending", "Failed"].includes(x))
    )
      throw new Error("Invalid customer check");
  for (const t of w.reservation_timing) {
    if (
      t.timezone !== d.metadata.source_timezone ||
      !d.reservations.some((r) => r.reservation_id === t.reservation_id) ||
      timestamp(t.pickup) >= timestamp(t.return_at)
    )
      throw new Error("Invalid reservation timing");
  }
  return d;
}
