import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import type { AllocationNodeState, AllocationSnapshot } from "../models/allocation/Allocation";

export function getNodeAllocationState(
  snapshot: AllocationSnapshot,
  nodeId: NodeId,
): AllocationNodeState | null {
  return snapshot.nodeStateById.get(nodeId) ?? null;
}
