import {
  type Equipment,
  type Inspection,
  type Maintenance,
  type NorthstarRidgeDataset,
  validateNorthstarRidgeDataset,
} from "../data/northstar-ridge-data.ts";

export const READINESS_OUTCOMES = [
  "Equipment Ready",
  "Inspection Required",
  "Maintenance Required",
  "Not Ready",
  "Human Review Required",
] as const;

export type ReadinessOutcome = (typeof READINESS_OUTCOMES)[number];

export type ReadinessReasonCode =
  | "CONTRADICTORY_READY_STATUS"
  | "FAILED_INSPECTION"
  | "UNRESOLVED_BLOCKING_DEFECT"
  | "REQUIRED_INSPECTION_MISSING"
  | "POST_RENTAL_INSPECTION_STALE"
  | "INSPECTION_EXPIRED"
  | "INSPECTION_HOURS_EXCEEDED"
  | "CALENDAR_MAINTENANCE_DUE"
  | "OPERATING_HOUR_MAINTENANCE_DUE"
  | "MISSING_ASSET_QUALIFICATION"
  | "MISSING_REQUIRED_ATTACHMENTS"
  | "MISSING_INSPECTION_EVIDENCE"
  | "MISSING_MAINTENANCE_EVIDENCE"
  | "ALL_CONTROLS_SATISFIED";

export interface EvidenceReference {
  record_type: "equipment" | "inspection" | "maintenance";
  record_id: string;
  evidence_reference?: string;
  fields: string[];
}

export interface EquipmentReadinessResult {
  equipment_id: string;
  readiness_outcome: ReadinessOutcome;
  reason_codes: ReadinessReasonCode[];
  explanations: string[];
  evidence_references: EvidenceReference[];
  as_of_date: string;
}

interface Finding {
  code: ReadinessReasonCode;
  explanation: string;
  evidence: EvidenceReference;
}

const datePattern = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
const completedStatuses = new Set(["closed", "complete", "completed", "resolved"]);

function requireAsOfDate(value: string): void {
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!datePattern.test(value) || Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error("asOfDate must be a valid calendar date in YYYY-MM-DD format");
  }
}

function isPresent(value: string | null): value is string {
  return value !== null && value.trim() !== "" && !["none", "n/a", "unknown", "missing"].includes(value.trim().toLowerCase());
}

function equipmentEvidence(equipment: Equipment, fields: string[]): EvidenceReference {
  return { record_type: "equipment", record_id: equipment.equipment_id, fields };
}

function inspectionEvidence(inspection: Inspection, fields: string[]): EvidenceReference {
  return { record_type: "inspection", record_id: inspection.inspection_id, evidence_reference: inspection.evidence_reference, fields };
}

function maintenanceEvidence(maintenance: Maintenance, fields: string[]): EvidenceReference {
  return { record_type: "maintenance", record_id: maintenance.maintenance_id, evidence_reference: maintenance.evidence_reference, fields };
}

function result(equipmentId: string, outcome: ReadinessOutcome, findings: Finding[], asOfDate: string): EquipmentReadinessResult {
  return {
    equipment_id: equipmentId,
    readiness_outcome: outcome,
    reason_codes: findings.map(({ code }) => code),
    explanations: findings.map(({ explanation }) => explanation),
    evidence_references: findings.map(({ evidence }) => evidence),
    as_of_date: asOfDate,
  };
}

/** Evaluates current operational readiness only; it deliberately ignores rental and customer records. */
export function evaluateEquipmentReadiness(
  value: unknown,
  equipmentId: string,
  asOfDate: string,
): EquipmentReadinessResult {
  requireAsOfDate(asOfDate);
  const dataset: NorthstarRidgeDataset = validateNorthstarRidgeDataset(value);
  const equipment = dataset.equipment.find(({ equipment_id }) => equipment_id === equipmentId);
  if (!equipment) throw new Error(`Unknown equipment_id '${equipmentId}'`);

  const inspections = dataset.inspections
    .filter(({ equipment_id }) => equipment_id === equipmentId)
    .toSorted((a, b) => b.inspection_date.localeCompare(a.inspection_date) || b.inspection_id.localeCompare(a.inspection_id));
  const maintenance = dataset.maintenance.filter(({ equipment_id }) => equipment_id === equipmentId);
  const latestInspection = inspections[0];
  const failed = latestInspection?.result.trim().toLowerCase() === "failed" ? [latestInspection] : [];
  const unresolvedDefects = failed.filter((inspection) =>
    inspection.defects_found.trim().toLowerCase() !== "none" &&
    !maintenance.some((record) => record.maintenance_type.toLowerCase().includes("repair") && completedStatuses.has(record.status.toLowerCase())),
  );
  const dueMaintenance = maintenance.filter((record) => {
    if (completedStatuses.has(record.status.toLowerCase()) || record.operational_interruption === "No interruption") return false;
    return (record.due_date !== null && record.due_date <= asOfDate) ||
      (record.due_operating_hours !== null && equipment.operating_hours >= record.due_operating_hours);
  });
  const blockingRepairs = maintenance.filter((record) =>
    !completedStatuses.has(record.status.toLowerCase()) &&
    record.operational_interruption !== "No interruption" &&
    (record.trigger_type.toLowerCase() === "condition" || record.maintenance_type.toLowerCase().includes("repair")),
  );

  const contradictionFindings: Finding[] = [];
  if (equipment.current_status === "Equipment Ready" && (failed.length > 0 || unresolvedDefects.length > 0 || blockingRepairs.length > 0 || dueMaintenance.length > 0)) {
    contradictionFindings.push({
      code: "CONTRADICTORY_READY_STATUS",
      explanation: "The source status says Equipment Ready, but blocking inspection, defect, or maintenance evidence requires reconciliation.",
      evidence: equipmentEvidence(equipment, ["current_status"]),
    });
  }
  if (contradictionFindings.length) return result(equipmentId, "Human Review Required", contradictionFindings, asOfDate);

  const notReadyFindings: Finding[] = failed.map((inspection) => ({
    code: "FAILED_INSPECTION",
    explanation: `Inspection ${inspection.inspection_id} explicitly failed.`,
    evidence: inspectionEvidence(inspection, ["result"]),
  }));
  notReadyFindings.push(...unresolvedDefects.map((inspection) => ({
    code: "UNRESOLVED_BLOCKING_DEFECT" as const,
    explanation: `Inspection ${inspection.inspection_id} has an unresolved defect: ${inspection.defects_found}.`,
    evidence: inspectionEvidence(inspection, ["defects_found", "corrective_work_reference"]),
  })));
  notReadyFindings.push(...blockingRepairs.map((record) => ({
    code: "UNRESOLVED_BLOCKING_DEFECT" as const,
    explanation: `Blocking repair ${record.maintenance_id} remains ${record.status.toLowerCase()}.`,
    evidence: maintenanceEvidence(record, ["maintenance_type", "trigger_type", "status", "operational_interruption"]),
  })));
  if (notReadyFindings.length) return result(equipmentId, "Not Ready", notReadyFindings, asOfDate);

  const inspectionFindings: Finding[] = [];
  if (!latestInspection) {
    inspectionFindings.push({ code: "REQUIRED_INSPECTION_MISSING", explanation: "No inspection record exists for this equipment.", evidence: equipmentEvidence(equipment, ["equipment_id"]) });
  } else {
    if (latestInspection.required_after_each_rental && latestInspection.inspection_date <= equipment.last_rental_end) {
      inspectionFindings.push({ code: "POST_RENTAL_INSPECTION_STALE", explanation: `Inspection ${latestInspection.inspection_id} did not occur after the last rental ended.`, evidence: inspectionEvidence(latestInspection, ["inspection_date", "required_after_each_rental"]) });
    }
    if (latestInspection.valid_until < asOfDate) inspectionFindings.push({ code: "INSPECTION_EXPIRED", explanation: `Inspection ${latestInspection.inspection_id} expired before the supplied as-of date.`, evidence: inspectionEvidence(latestInspection, ["valid_until"]) });
    if (latestInspection.next_due_hours !== null && equipment.operating_hours >= latestInspection.next_due_hours) inspectionFindings.push({ code: "INSPECTION_HOURS_EXCEEDED", explanation: `Inspection ${latestInspection.inspection_id} is due at the current operating hours.`, evidence: inspectionEvidence(latestInspection, ["next_due_hours"]) });
  }
  if (inspectionFindings.length) return result(equipmentId, "Inspection Required", inspectionFindings, asOfDate);

  const maintenanceFindings: Finding[] = dueMaintenance.map((record) => {
    const hoursDue = record.due_operating_hours !== null && equipment.operating_hours >= record.due_operating_hours;
    return {
      code: hoursDue ? "OPERATING_HOUR_MAINTENANCE_DUE" : "CALENDAR_MAINTENANCE_DUE",
      explanation: hoursDue ? `Maintenance ${record.maintenance_id} is due at the current operating hours.` : `Maintenance ${record.maintenance_id} is due by the supplied as-of date.`,
      evidence: maintenanceEvidence(record, hoursDue ? ["due_operating_hours", "status", "operational_interruption"] : ["due_date", "status", "operational_interruption"]),
    };
  });
  if (maintenanceFindings.length) return result(equipmentId, "Maintenance Required", maintenanceFindings, asOfDate);

  const missingFindings: Finding[] = [];
  if (!isPresent(equipment.asset_qualification_reference)) missingFindings.push({ code: "MISSING_ASSET_QUALIFICATION", explanation: "Required asset qualification evidence is missing.", evidence: equipmentEvidence(equipment, ["asset_qualification_reference"]) });
  if (!isPresent(equipment.required_attachments)) missingFindings.push({ code: "MISSING_REQUIRED_ATTACHMENTS", explanation: "Required attachment information is missing.", evidence: equipmentEvidence(equipment, ["required_attachments"]) });
  if (latestInspection && !isPresent(latestInspection.evidence_reference)) missingFindings.push({ code: "MISSING_INSPECTION_EVIDENCE", explanation: `Inspection ${latestInspection.inspection_id} lacks a usable evidence reference.`, evidence: inspectionEvidence(latestInspection, ["evidence_reference"]) });
  for (const record of maintenance) if (!isPresent(record.evidence_reference)) missingFindings.push({ code: "MISSING_MAINTENANCE_EVIDENCE", explanation: `Maintenance ${record.maintenance_id} lacks a usable evidence reference.`, evidence: maintenanceEvidence(record, ["evidence_reference"]) });
  if (missingFindings.length) return result(equipmentId, "Human Review Required", missingFindings, asOfDate);

  return result(equipmentId, "Equipment Ready", [{ code: "ALL_CONTROLS_SATISFIED", explanation: "All required readiness controls are satisfied as of the supplied date.", evidence: equipmentEvidence(equipment, ["equipment_id", "operating_hours", "current_condition"]) }], asOfDate);
}
