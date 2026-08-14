import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { evaluateEquipmentReadiness } from "../domain/equipment-readiness.ts";

const snapshotText = await readFile(new URL("../data/northstar-ridge-demo-data.json", import.meta.url), "utf8");
const snapshot = JSON.parse(snapshotText);
const copy = () => structuredClone(snapshot);
const evaluate = (equipmentId, asOfDate = "2026-09-10", data = snapshot) => evaluateEquipmentReadiness(data, equipmentId, asOfDate);

test("EQ-1001 is the ready baseline", () => assert.equal(evaluate("EQ-1001").readiness_outcome, "Equipment Ready"));
test("EQ-1002 requires a post-rental inspection", () => assert.deepEqual(evaluate("EQ-1002").reason_codes, ["POST_RENTAL_INSPECTION_STALE"]));
test("EQ-1003 requires calendar maintenance on its due date", () => assert.equal(evaluate("EQ-1003").readiness_outcome, "Maintenance Required"));
test("EQ-1006 contradictory Ready status takes precedence over failed evidence", () => assert.deepEqual(evaluate("EQ-1006"), {
  equipment_id: "EQ-1006", readiness_outcome: "Human Review Required", reason_codes: ["CONTRADICTORY_READY_STATUS"],
  explanations: ["The source status says Equipment Ready, but blocking inspection, defect, or maintenance evidence requires reconciliation."],
  evidence_references: [{ record_type: "equipment", record_id: "EQ-1006", fields: ["current_status"] }], as_of_date: "2026-09-10",
}));

test("calendar and operating-hour maintenance triggers are deterministic", () => {
  assert.equal(evaluate("EQ-1003", "2026-09-09").readiness_outcome, "Equipment Ready");
  const data = copy();
  const equipment = data.equipment.find(({ equipment_id }) => equipment_id === "EQ-1001");
  equipment.operating_hours = 1000;
  equipment.current_status = "Maintenance Due";
  data.inspections.find(({ equipment_id }) => equipment_id === "EQ-1001").next_due_hours = 1100;
  assert.deepEqual(evaluate("EQ-1001", "2026-09-10", data).reason_codes, ["OPERATING_HOUR_MAINTENANCE_DUE"]);
});

test("a failed inspection without contradictory Ready status is Not Ready", () => {
  const data = copy();
  data.equipment.find(({ equipment_id }) => equipment_id === "EQ-1006").current_status = "Inspection Failed";
  assert.equal(evaluate("EQ-1006", "2026-09-10", data).readiness_outcome, "Not Ready");
});

test("an unresolved blocking repair is Not Ready even before its due date", () => {
  const data = copy();
  const equipment = data.equipment.find(({ equipment_id }) => equipment_id === "EQ-1006");
  equipment.current_status = "Repair Open";
  const inspection = data.inspections.find(({ equipment_id }) => equipment_id === "EQ-1006");
  inspection.result = "Passed";
  inspection.defects_found = "None";
  assert.equal(evaluate("EQ-1006", "2026-09-04", data).readiness_outcome, "Not Ready");
});

test("missing supporting evidence requires human review", () => {
  const data = copy();
  data.equipment.find(({ equipment_id }) => equipment_id === "EQ-1001").asset_qualification_reference = "Missing";
  assert.deepEqual(evaluate("EQ-1001", "2026-09-10", data).reason_codes, ["MISSING_ASSET_QUALIFICATION"]);
});

test("repeat evaluation produces identical structured results", () => assert.deepEqual(evaluate("EQ-1001"), evaluate("EQ-1001")));

test("current_status alone cannot produce Equipment Ready", () => {
  const data = copy();
  data.inspections = data.inspections.filter(({ equipment_id }) => equipment_id !== "EQ-1001");
  assert.equal(evaluate("EQ-1001", "2026-09-10", data).readiness_outcome, "Inspection Required");
});

test("future-dated inspections are excluded from the as-of evaluation", () => {
  const data = copy();
  data.inspections.find(({ equipment_id }) => equipment_id === "EQ-1001").inspection_date = "2026-09-11";
  assert.deepEqual(evaluate("EQ-1001", "2026-09-10", data).reason_codes, ["REQUIRED_INSPECTION_MISSING"]);
});

test("an inspection must be explicitly Passed to establish readiness", () => {
  const data = copy();
  data.inspections.find(({ equipment_id }) => equipment_id === "EQ-1001").result = "Pending";
  assert.deepEqual(evaluate("EQ-1001", "2026-09-10", data).reason_codes, ["INSPECTION_NOT_PASSED"]);
});

test("a defect without verifiable corrective-work linkage requires human review", () => {
  const data = copy();
  const equipment = data.equipment.find(({ equipment_id }) => equipment_id === "EQ-1001");
  equipment.current_status = "Defect Open";
  data.inspections.find(({ equipment_id }) => equipment_id === "EQ-1001").defects_found = "Hydraulic leak";
  assert.deepEqual(evaluate("EQ-1001", "2026-09-10", data).reason_codes, ["DEFECT_CORRECTIVE_WORK_UNVERIFIED"]);
});

test("a newer unrelated inspection cannot displace a required post-rental inspection", () => {
  const data = copy();
  const requiredInspection = data.inspections.find(({ equipment_id }) => equipment_id === "EQ-1002");
  data.inspections.push({
    ...requiredInspection,
    inspection_id: "INSP-UNRELATED-NEWER",
    inspection_type: "Annual certification",
    required_after_each_rental: false,
    inspection_date: "2026-09-09",
    valid_until: "2027-09-09",
  });
  assert.deepEqual(evaluate("EQ-1002", "2026-09-10", data).reason_codes, ["POST_RENTAL_INSPECTION_STALE"]);
});

test("all required-inspection controls evaluate the required post-rental record", () => {
  const data = copy();
  const requiredInspection = data.inspections.find(({ equipment_id }) => equipment_id === "EQ-1001");
  requiredInspection.result = "Pending";
  requiredInspection.defects_found = "Hydraulic leak";
  requiredInspection.corrective_work_reference = "MNT-DOES-NOT-EXIST";
  requiredInspection.valid_until = "2026-09-09";
  requiredInspection.next_due_hours = 800;
  data.inspections.push({
    ...requiredInspection,
    inspection_id: "INSP-UNRELATED-PASSED",
    inspection_type: "Annual certification",
    required_after_each_rental: false,
    result: "Passed",
    defects_found: "None",
    corrective_work_reference: null,
    inspection_date: "2026-09-09",
    valid_until: "2027-09-09",
    next_due_hours: 2000,
  });
  assert.deepEqual(evaluate("EQ-1001", "2026-09-10", data).reason_codes, ["DEFECT_CORRECTIVE_WORK_UNVERIFIED"]);

  requiredInspection.defects_found = "None";
  requiredInspection.corrective_work_reference = null;
  assert.deepEqual(evaluate("EQ-1001", "2026-09-10", data).reason_codes, [
    "INSPECTION_NOT_PASSED", "INSPECTION_EXPIRED", "INSPECTION_HOURS_EXCEEDED",
  ]);
});

test("only explicitly linked completed corrective work resolves an inspection defect", () => {
  const data = copy();
  const inspection = data.inspections.find(({ equipment_id }) => equipment_id === "EQ-1001");
  inspection.defects_found = "Hydraulic leak";
  inspection.corrective_work_reference = "MNT-3001";
  data.maintenance.find(({ maintenance_id }) => maintenance_id === "MNT-3001").status = "Completed";
  assert.equal(evaluate("EQ-1001", "2026-09-10", data).readiness_outcome, "Equipment Ready");

  inspection.corrective_work_reference = "UNMATCHED-REPAIR";
  assert.deepEqual(evaluate("EQ-1001", "2026-09-10", data).reason_codes, ["DEFECT_CORRECTIVE_WORK_UNVERIFIED"]);
});

test("adverse source status or condition cannot produce Equipment Ready", () => {
  for (const [field, value] of [["current_status", "Out of Service"], ["current_condition", "Unsafe"]]) {
    const data = copy();
    data.equipment.find(({ equipment_id }) => equipment_id === "EQ-1001")[field] = value;
    assert.deepEqual(evaluate("EQ-1001", "2026-09-10", data).reason_codes, ["ADVERSE_EQUIPMENT_STATE"]);
    assert.equal(evaluate("EQ-1001", "2026-09-10", data).readiness_outcome, "Human Review Required");
  }
});

test("an explicit, valid as-of date is required", () => {
  assert.throws(() => evaluate("EQ-1001", ""), /asOfDate/);
  assert.throws(() => evaluate("EQ-1001", "2026-02-30"), /asOfDate/);
});

test("the original JSON snapshot remains byte-for-byte unchanged", () => {
  assert.equal(createHash("sha256").update(snapshotText).digest("hex"), "1b3de2c2585d3381f447bf5f2efe28804843f6dfb32c1e05f8dd416e56f01235");
});
