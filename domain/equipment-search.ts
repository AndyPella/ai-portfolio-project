import type { Equipment } from "../data/northstar-ridge-data.ts";
export interface EquipmentMatch {
  equipment_id: string;
  equipment_type: string;
  location: string;
}
/** Exact identifiers and constrained terms only. Ambiguous results require staff confirmation. */
export function findEquipment(
  equipment: Equipment[],
  input: string,
): { matches: EquipmentMatch[]; exact: boolean; message: string } {
  const compact = (value: string) => value.toUpperCase().replace(/[\s-]/g, "");
  const query = input
    .trim()
    .toLowerCase()
    .replace(/^i (?:need|want)(?: to rent)? (?:an? )?/, "")
    .replace(/[.!?]+$/, "");
  const exact = equipment.find(
    (e) =>
      compact(e.equipment_id) === compact(input) ||
      e.serial_number.toLowerCase() === input.trim().toLowerCase(),
  );
  const aliases: Record<string, string> = {
    excavator: "Compact excavator",
    "skid steer": "Skid steer loader",
    "boom lift": "Articulating boom lift",
    generator: "Towable generator",
    compactor: "Plate compactor",
    "scissor lift": "Scissor lift",
  };
  const type = aliases[query] ?? query.replace(/s$/, "");
  const matched = exact
    ? [exact]
    : equipment.filter(
        (e) =>
          e.equipment_type.toLowerCase() === query ||
          e.equipment_type.toLowerCase() === type.toLowerCase() ||
          (query === "lift" && e.equipment_type.toLowerCase().includes("lift")),
      );
  return {
    matches: matched.map((e) => ({
      equipment_id: e.equipment_id,
      equipment_type: e.equipment_type,
      location: e.current_location,
    })),
    exact: !!exact,
    message:
      matched.length === 0
        ? "No recorded equipment matches. Confirm the identifier or equipment need."
        : new Set(matched.map((e) => e.equipment_type)).size > 1
          ? "Clarify which equipment type is required."
          : exact
            ? "Exact equipment match. Confirm its request details."
            : "Recorded equipment type found. Confirm capabilities and branch.",
  };
}
