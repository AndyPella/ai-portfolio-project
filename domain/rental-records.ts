import type { NorthstarRidgeDataset } from "../data/northstar-ridge-data.ts";

export type Role =
  "Customer Service" | "Mechanic" | "Inspector" | "Manager" | "General Staff";
export type Criticality =
  "Safety-critical" | "Operationally critical" | "Noncritical" | "Unclassified";
export interface Staff {
  staff_id: string;
  name: string;
  role: Role;
  qualifications: string[];
}
export interface Policy {
  policy_id: string;
  version: string;
  system_group: string;
  name: string;
  max_days: number;
  max_hours: number;
  fictional: boolean;
}
export interface MaintenanceControl {
  maintenance_id: string;
  system_group: string;
  criticality: Criticality;
  delay_gate:
    | "No operation beyond service limit"
    | "Delay Permitted Within Policy"
    | "Human Review Required";
  policy_id: string;
  policy_version: string;
  warranty_status: "Covered" | "Out of warranty" | "Unknown";
  warranty_reference: string;
  warranty_max_days: number | null;
  warranty_max_hours: number | null;
  task_max_days: number | null;
  task_max_hours: number | null;
  assessed_by: string;
  assessment_evidence: string;
  next_due_operating_hours: number | null;
}
export interface Hold {
  hold_id: string;
  equipment_id: string;
  task_id: string;
  authority: "Mechanic" | "Manager";
  reason: string;
  evidence: string;
  active: boolean;
}
export interface CustomerCheck {
  customer_id: string;
  route: "Existing" | "New" | "Uncertain";
  identity: "Verified" | "Pending" | "Failed";
  profile: "Verified" | "Pending" | "Failed";
  billing: "Verified" | "Pending" | "Failed";
  insurance_on_site: "Verified" | "Pending" | "Failed";
  insurance_transport: "Verified" | "Pending" | "Failed";
  evidence: string;
}
export interface UsageWindow {
  start: string;
  end: string;
  hours: number;
}
export interface Intake {
  renter_name: string;
  company_name: string;
  billing_contact: string;
  billing_address: string;
  delivery_address: string;
  primary_contact: string;
  contact: string;
  pickup_contact: string;
  return_contact: string;
  responsibilities: string;
  notes: string;
}
export interface RentalRequest {
  equipment_id?: string;
  request_id: string;
  customer_id: string;
  equipment_type: string;
  capabilities: string[];
  attachments: string[];
  pickup: string;
  return_at: string;
  timezone: string;
  location: string;
  intended_use: string;
  daily_hours: number;
  total_hours: number;
  usage: UsageWindow[];
  preparation_hours: number;
  turnaround_hours: number;
  logistics_confirmed: boolean;
  site_documents: "Verified" | "Pending" | "Failed";
  intake: Intake;
}
export interface ReservationTiming {
  reservation_id: string;
  pickup: string;
  return_at: string;
  timezone: string;
}
export interface WorkflowSource {
  policies: Policy[];
  maintenance_controls: MaintenanceControl[];
  staff: Staff[];
  holds: Hold[];
  customer_checks: CustomerCheck[];
  rental_requests: RentalRequest[];
  reservation_timing: ReservationTiming[];
}
export type RentalDataset = NorthstarRidgeDataset & {
  rental_workflow: WorkflowSource;
};
export interface Decision {
  decision_id: string;
  actor: string;
  timestamp: string;
  equipment_id: string;
  reference: string;
  action: string;
  reason: string;
  evidence: string;
  scope: string;
}
export interface DelayApproval {
  maintenance_id: string;
  request_scope: string;
  actor: string;
  timestamp: string;
  service_at: string;
  service_meter: number;
  evidence: string;
}
export interface ServicePlan {
  plan_id: string;
  request_id: string;
  equipment_id: string;
  maintenance_id: string;
  start: string;
  end: string;
  confirmed: boolean;
  logistics_confirmed: boolean;
  evidence: string;
  instructions: string;
}
export interface SwapPlan {
  plan_id: string;
  request_id: string;
  original_id: string;
  replacement_id: string;
  handoff: string;
  delivery_at: string;
  collection_at: string;
  downtime_hours: number;
  original_hours: number;
  replacement_hours: number;
  confirmed: boolean;
  evidence: string;
  instructions: string;
  approved_by: string;
  request_scope: string;
}
export interface Allocation {
  allocation_id: string;
  request_id: string;
  equipment_id: string;
  protected_start: string;
  protected_end: string;
  status: "Temporary" | "Confirmed" | "Canceled" | "Expired";
  created_at: string;
  expires_at: string;
  scope: string;
}
export interface Callback {
  callback_id: string;
  request_id: string;
  equipment_id: string;
  contact: string;
  update_at: string;
  reviewer: Role;
  owner: string;
  question: string;
  review_result: string;
  review_status:
    "Pending" | "Incomplete" | "Confirmed plan" | "Denied" | "Complete";
  request_scope: string;
  customer_update: string;
  status: "Open" | "Closed";
}
export interface RentalState {
  dataset: RentalDataset;
  allocations: Allocation[];
  decisions: Decision[];
  delay_approvals: DelayApproval[];
  service_plans: ServicePlan[];
  swap_plans: SwapPlan[];
  callbacks: Callback[];
  drafts: Record<
    string,
    {
      status: "Draft" | "Canceled" | "Confirmed";
      approved_scope: string;
      accepted_scope: string;
      conditions_scope: string;
    }
  >;
}
/** A canonical request signature invalidates decisions after any material intake/usage/logistics change. */
export function requestScope(request: RentalRequest): string {
  return JSON.stringify(request);
}
export function createRentalState(dataset: RentalDataset): RentalState {
  return {
    dataset: structuredClone(dataset),
    allocations: [],
    decisions: [],
    delay_approvals: [],
    service_plans: [],
    swap_plans: [],
    callbacks: [],
    drafts: {},
  };
}
