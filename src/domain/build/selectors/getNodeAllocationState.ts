import type { NodeId } from "@/domain/graph/PassiveNode";
import type { AllocationNodeState, AllocationState } from "../models/allocation/Allocation";

export function getNodeAllocationState(
  snapshot: AllocationState,
  nodeId: NodeId,
): AllocationNodeState | null {
  return snapshot.nodeStateById.get(nodeId) ?? null;
}
