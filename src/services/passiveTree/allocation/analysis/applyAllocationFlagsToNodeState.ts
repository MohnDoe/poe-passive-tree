import type { AllocationNodeState } from "@/domain/build/models/allocation/Allocation";
import type { BuildState } from "@/domain/build/models/BuildState";
import { getPointBudgets } from "@/domain/build/selectors/getPointBudgets";
import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeId, PassiveNode } from "@/domain/passiveGraph/PassiveNode";

export interface ApplyAllocationFlagsToNodeStateParams {
  graph: PassiveGraph;
  build: BuildState;
  nodeStateById: Map<NodeId, AllocationNodeState>;
}

export function applyAllocationFlagsToNodeState({
  graph,
  nodeStateById,
  build,
}: ApplyAllocationFlagsToNodeStateParams) {
  const pointBudgets = getPointBudgets(graph, build);

  for (const [nodeId, nodeState] of nodeStateById) {
    const node = graph.nodesById.get(nodeId);
    if (!node) {
      nodeState.allocatable = false;
      continue;
    }

    const costsSomething = nodeState.pathCost !== null && nodeState.pathCost > 0;
    const cost = nodeState.pathCost ?? 0;

    const region = graph.regionByNodeId.get(nodeId);

    const hasBudget =
      region === "ascendancy"
        ? pointBudgets.remaining.ascendancy >= cost
        : pointBudgets.remaining.passive >= cost;

    nodeState.allocatable =
      !nodeState.allocated &&
      nodeState.reachable &&
      costsSomething &&
      hasBudget &&
      !isForbiddenAllocationTarget(node);
  }
}

function isForbiddenAllocationTarget(node: PassiveNode) {
  return node.kind === "classStart" || node.kind === "ascendancyStart";
}
