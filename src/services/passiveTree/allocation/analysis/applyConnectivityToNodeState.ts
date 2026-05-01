import type { AllocationNodeState } from "@/domain/build/models/allocation/Allocation";
import type { NodeId } from "@/domain/graph/PassiveNode";

export function applyConnectivityToNodeState(
  nodeStateById: Map<NodeId, AllocationNodeState>,
  connectedNodeIds: ReadonlySet<NodeId>,
): void {
  for (const [nodeId, state] of nodeStateById) {
    state.connectedToStart = connectedNodeIds.has(nodeId);
  }
}
