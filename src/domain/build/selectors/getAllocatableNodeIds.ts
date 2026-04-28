import type { AllocationSnapshot } from "../models/allocation/Allocation";

export function getAllocatableNodeIds(
  snapshot: AllocationSnapshot,
): AllocationSnapshot["allocatableNodeIds"] {
  return snapshot.allocatableNodeIds;
}
