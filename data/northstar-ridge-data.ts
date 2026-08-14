export interface DatasetMetadata {
  schema_version: string; dataset_name: string; data_classification: string;
  source_type: string; source_timezone: string;
}

export interface DemoScenario {
  scenario_id: string; scenario_name: string; equipment_id: string; customer_id: string;
  requested_start: string; requested_end: string; expected_outcome: string;
  primary_reason: string; assurance_test: string;
}

export interface Equipment {
  equipment_id: string; asset_qualification_reference: string; equipment_type: string;
  category: string; manufacturer: string; model: string; model_year: number;
  serial_number: string; current_location: string; current_status: string;
  operating_hours: number; capabilities: string; required_attachments: string;
  last_rental_end: string; current_condition: string; record_updated: string;
}

export interface Inspection {
  inspection_id: string; equipment_id: string; inspection_type: string;
  required_after_each_rental: boolean; inspection_date: string; related_rental_id: string | null;
  result: string; defects_found: string; corrective_work_reference: string | null;
  valid_until: string; next_due_hours: number | null; performed_by_role: string;
  evidence_reference: string;
}

export interface Maintenance {
  maintenance_id: string; equipment_id: string; maintenance_type: string; trigger_type: string;
  due_date: string | null; due_operating_hours: number | null; estimated_duration_hours: number;
  scheduled_start: string | null; scheduled_end: string | null; service_location_type: string;
  on_site_permitted: boolean; operational_interruption: string; parts_confirmed: boolean;
  technician_confirmed: boolean; status: string; evidence_reference: string;
  expected_hours_during_rental: number; notes: string;
}

export interface Reservation {
  reservation_id: string; equipment_id: string; customer_id: string; start_date: string;
  end_date: string; preparation_buffer_hours: number; return_buffer_hours: number;
  status: string; location: string; estimated_operating_hours: number; purpose: string;
}

export interface ServiceCapability {
  service_capability_id: string; equipment_type: string; work_type: string;
  service_provider_type: string; permitted_on_site: boolean; facility_required: boolean;
  estimated_duration_hours: number; required_certification: string;
  operational_interruption: string; advance_notice_hours: number;
}

export interface CustomerRequirement {
  customer_id: string; customer_type: string; service_location: string;
  contract_requirements: string; required_documentation: string; site_restrictions: string;
  equipment_requirements: string; on_site_service_allowed: boolean; access_windows: string;
  operational_notes: string;
}

export interface NorthstarRidgeDataset {
  metadata: DatasetMetadata;
  demo_scenarios: DemoScenario[];
  equipment: Equipment[];
  inspections: Inspection[];
  maintenance: Maintenance[];
  reservations: Reservation[];
  service_capabilities: ServiceCapability[];
  customer_requirements: CustomerRequirement[];
}

type FieldKind = "string" | "number" | "boolean" | "date" | "timestamp";
type FieldRule = FieldKind | { kind: FieldKind; nullable: true };
type Schema = Record<string, FieldRule>;

const schemas: Record<keyof NorthstarRidgeDataset, Schema | "object"> = {
  metadata: "object",
  demo_scenarios: { scenario_id:"string", scenario_name:"string", equipment_id:"string", customer_id:"string", requested_start:"date", requested_end:"date", expected_outcome:"string", primary_reason:"string", assurance_test:"string" },
  equipment: { equipment_id:"string", asset_qualification_reference:"string", equipment_type:"string", category:"string", manufacturer:"string", model:"string", model_year:"number", serial_number:"string", current_location:"string", current_status:"string", operating_hours:"number", capabilities:"string", required_attachments:"string", last_rental_end:"date", current_condition:"string", record_updated:"date" },
  inspections: { inspection_id:"string", equipment_id:"string", inspection_type:"string", required_after_each_rental:"boolean", inspection_date:"date", related_rental_id:{kind:"string",nullable:true}, result:"string", defects_found:"string", corrective_work_reference:{kind:"string",nullable:true}, valid_until:"date", next_due_hours:{kind:"number",nullable:true}, performed_by_role:"string", evidence_reference:"string" },
  maintenance: { maintenance_id:"string", equipment_id:"string", maintenance_type:"string", trigger_type:"string", due_date:{kind:"date",nullable:true}, due_operating_hours:{kind:"number",nullable:true}, estimated_duration_hours:"number", scheduled_start:{kind:"timestamp",nullable:true}, scheduled_end:{kind:"timestamp",nullable:true}, service_location_type:"string", on_site_permitted:"boolean", operational_interruption:"string", parts_confirmed:"boolean", technician_confirmed:"boolean", status:"string", evidence_reference:"string", expected_hours_during_rental:"number", notes:"string" },
  reservations: { reservation_id:"string", equipment_id:"string", customer_id:"string", start_date:"date", end_date:"date", preparation_buffer_hours:"number", return_buffer_hours:"number", status:"string", location:"string", estimated_operating_hours:"number", purpose:"string" },
  service_capabilities: { service_capability_id:"string", equipment_type:"string", work_type:"string", service_provider_type:"string", permitted_on_site:"boolean", facility_required:"boolean", estimated_duration_hours:"number", required_certification:"string", operational_interruption:"string", advance_notice_hours:"number" },
  customer_requirements: { customer_id:"string", customer_type:"string", service_location:"string", contract_requirements:"string", required_documentation:"string", site_restrictions:"string", equipment_requirements:"string", on_site_service_allowed:"boolean", access_windows:"string", operational_notes:"string" },
};

const metadataSchema: Schema = { schema_version:"string", dataset_name:"string", data_classification:"string", source_type:"string", source_timezone:"string" };
const ids: Partial<Record<keyof NorthstarRidgeDataset, string>> = { demo_scenarios:"scenario_id", equipment:"equipment_id", inspections:"inspection_id", maintenance:"maintenance_id", reservations:"reservation_id", service_capabilities:"service_capability_id", customer_requirements:"customer_id" };
const datePattern = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;
const timestampPattern = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:Z|[+-](?:0\d|1[0-4]):[0-5]\d)$/;

function fail(type: string, id: string, field: string, reason: string): never {
  throw new Error(`${type} '${id}', field '${field}': ${reason}`);
}

function validateRecord(type: string, value: unknown, schema: Schema, fallbackId: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(type, fallbackId, "record", "must be an object");
  const record = value as Record<string, unknown>;
  const idField = ids[type as keyof NorthstarRidgeDataset];
  const id = idField && typeof record[idField] === "string" ? record[idField] : fallbackId;
  for (const [field, rule] of Object.entries(schema)) {
    const nullable = typeof rule === "object";
    const kind = nullable ? rule.kind : rule;
    const fieldValue = record[field];
    if (fieldValue === undefined) fail(type, id, field, "is required");
    if (fieldValue === null) {
      if (!nullable) fail(type, id, field, "must not be null");
      continue;
    }
    if (fieldValue === "" && nullable) fail(type, id, field, "empty strings must be normalized to null");
    if (kind === "date" && (typeof fieldValue !== "string" || !datePattern.test(fieldValue))) fail(type, id, field, "must use YYYY-MM-DD format");
    else if (kind === "timestamp" && (typeof fieldValue !== "string" || !timestampPattern.test(fieldValue))) fail(type, id, field, "must be an ISO 8601 timestamp with an explicit timezone");
    else if (kind !== "date" && kind !== "timestamp" && typeof fieldValue !== kind) fail(type, id, field, `must be a ${kind}`);
    if (kind === "string" && fieldValue === "") fail(type, id, field, "must not be an empty string");
  }
  return record;
}

export function validateNorthstarRidgeDataset(value: unknown): NorthstarRidgeDataset {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail("dataset", "root", "record", "must be an object");
  const dataset = value as Record<string, unknown>;
  validateRecord("metadata", "metadata" in dataset ? dataset.metadata : undefined, metadataSchema, "metadata");
  const records: Record<string, Record<string, unknown>[]> = {};
  for (const [type, schema] of Object.entries(schemas)) {
    if (type === "metadata") continue;
    const group = dataset[type];
    if (!Array.isArray(group)) fail(type, "group", type, "must be an array");
    records[type] = group.map((record, index) => validateRecord(type, record, schema as Schema, `index ${index}`));
    const idField = ids[type as keyof NorthstarRidgeDataset] as string;
    const seen = new Set<unknown>();
    for (const record of records[type]) {
      const id = record[idField];
      if (seen.has(id)) fail(type, String(id), idField, "duplicate primary identifier");
      seen.add(id);
    }
  }
  const equipmentIds = new Set(records.equipment.map(record => record.equipment_id));
  const customerIds = new Set(records.customer_requirements.map(record => record.customer_id));
  for (const type of ["demo_scenarios", "inspections", "maintenance", "reservations"]) {
    for (const record of records[type]) if (!equipmentIds.has(record.equipment_id)) fail(type, String(record[ids[type as keyof NorthstarRidgeDataset] as string]), "equipment_id", `references unknown equipment '${record.equipment_id}'`);
  }
  for (const type of ["demo_scenarios", "reservations"]) {
    for (const record of records[type]) if (!customerIds.has(record.customer_id)) fail(type, String(record[ids[type as keyof NorthstarRidgeDataset] as string]), "customer_id", `references unknown customer '${record.customer_id}'`);
  }
  return value as NorthstarRidgeDataset;
}
