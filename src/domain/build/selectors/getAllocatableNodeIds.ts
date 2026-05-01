import type { AllocationState } from "../models/allocation/Allocation";

export function getAllocatableNodeIds(
  snapshot: AllocationState,
): AllocationState["allocatableNodeIds"] {
  return snapshot.allocatableNodeIds;
}
