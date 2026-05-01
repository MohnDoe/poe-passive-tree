import type { AllocationNodeState } from "@/domain/build/models/allocation/Allocation";
import type { BuildState } from "@/domain/build/models/BuildState";
import { getPointBudgetSummary } from "@/domain/build/selectors/getPointBudgetSummary";
import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import type { NodeId, PassiveNode } from "@/domain/graph/PassiveNode";

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
  const pointBudgetSummary = getPointBudgetSummary(graph, build);

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
        ? pointBudgetSummary.remaining.ascendancy >= cost
        : pointBudgetSummary.remaining.passive >= cost;

    nodeState.allocatable =
      !nodeState.allocated &&
      nodeState.reachable &&
      ((costsSomething && hasBudget) || true) && //TODO: fix issue : hover shows what can't be done, so for now : let allocation even out of budget
      !isForbiddenAllocationTarget(node);
  }
}

function isForbiddenAllocationTarget(node: PassiveNode) {
  return node.kind === "classStart" || node.kind === "ascendancyStart";
}
