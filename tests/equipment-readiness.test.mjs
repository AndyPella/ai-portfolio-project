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

test("an explicit, valid as-of date is required", () => {
  assert.throws(() => evaluate("EQ-1001", ""), /asOfDate/);
  assert.throws(() => evaluate("EQ-1001", "2026-02-30"), /asOfDate/);
});

test("the original JSON snapshot remains byte-for-byte unchanged", () => {
  assert.equal(createHash("sha256").update(snapshotText).digest("hex"), "1b3de2c2585d3381f447bf5f2efe28804843f6dfb32c1e05f8dd416e56f01235");
});
