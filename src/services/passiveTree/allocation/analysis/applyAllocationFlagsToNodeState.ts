import type { AllocationNodeState } from "@/domain/build/models/allocation/Allocation";
import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeId, PassiveNode } from "@/domain/passiveGraph/PassiveNode";

export interface ApplyAllocationFlagsToNodeStateParams {
  graph: PassiveGraph;
  nodeStateById: Map<NodeId, AllocationNodeState>;
}

export function applyAllocationFlagsToNodeState({
  graph,
  nodeStateById,
}: ApplyAllocationFlagsToNodeStateParams) {
  for (const [nodeId, nodeState] of nodeStateById) {
    const node = graph.nodesById.get(nodeId);
    if (!node) {
      nodeState.allocatable = false;
      continue;
    }

    const costsSomething = nodeState.pathCost !== null && nodeState.pathCost > 0;

    nodeState.allocatable =
      !nodeState.allocated &&
      nodeState.reachable &&
      costsSomething &&
      !isForbiddenAllocationTarget(node);
  }
}

function isForbiddenAllocationTarget(node: PassiveNode) {
  return node.kind === "classStart" || node.kind === "ascendancyStart";
}
