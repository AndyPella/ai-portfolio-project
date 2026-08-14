import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateNorthstarRidgeDataset } from "../data/northstar-ridge-data.ts";

const snapshot = JSON.parse(await readFile(new URL("../data/northstar-ridge-demo-data.json", import.meta.url), "utf8"));
const copy = () => structuredClone(snapshot);

test("the committed snapshot is valid", () => {
  assert.equal(validateNorthstarRidgeDataset(copy()).metadata.schema_version, "1.0");
});

test("duplicate primary identifiers are rejected", () => {
  const data = copy();
  data.equipment[1].equipment_id = data.equipment[0].equipment_id;
  assert.throws(() => validateNorthstarRidgeDataset(data), /equipment 'EQ-1001', field 'equipment_id': duplicate primary identifier/);
});

test("missing equipment and customer references are rejected", () => {
  const equipmentData = copy();
  equipmentData.maintenance[0].equipment_id = "EQ-MISSING";
  assert.throws(() => validateNorthstarRidgeDataset(equipmentData), /maintenance 'MNT-3001'.*references unknown equipment 'EQ-MISSING'/);

  const customerData = copy();
  customerData.reservations[0].customer_id = "CUS-MISSING";
  assert.throws(() => validateNorthstarRidgeDataset(customerData), /reservations 'RSV-4001'.*references unknown customer 'CUS-MISSING'/);
});

test("scenario references are validated", () => {
  const data = copy();
  data.demo_scenarios[0].equipment_id = "EQ-MISSING";
  assert.throws(() => validateNorthstarRidgeDataset(data), /demo_scenarios 'SCN-001'.*field 'equipment_id'/);
});

test("invalid number and boolean types are rejected with useful messages", () => {
  const numberData = copy();
  numberData.equipment[0].operating_hours = "820";
  assert.throws(() => validateNorthstarRidgeDataset(numberData), /equipment 'EQ-1001', field 'operating_hours': must be a number/);

  const booleanData = copy();
  booleanData.inspections[0].required_after_each_rental = "true";
  assert.throws(() => validateNorthstarRidgeDataset(booleanData), /inspections 'INSP-2001', field 'required_after_each_rental': must be a boolean/);
});

test("invalid date and timestamp formats are rejected", () => {
  const dateData = copy();
  dateData.reservations[0].start_date = "09/08/2026";
  assert.throws(() => validateNorthstarRidgeDataset(dateData), /field 'start_date': must use YYYY-MM-DD format/);

  const timestampData = copy();
  timestampData.maintenance[2].scheduled_start = "2026-09-10 08:00:00";
  assert.throws(() => validateNorthstarRidgeDataset(timestampData), /field 'scheduled_start': must be an ISO 8601 timestamp with an explicit timezone/);
});

test("empty strings are rejected where null is the normalized representation", () => {
  const data = copy();
  data.maintenance[0].due_date = "";
  assert.throws(() => validateNorthstarRidgeDataset(data), /maintenance 'MNT-3001', field 'due_date': empty strings must be normalized to null/);
});
