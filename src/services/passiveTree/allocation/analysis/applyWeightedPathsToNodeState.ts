import type { NodeId } from "@/domain/graph/PassiveNode";
import type { AllocationNodeState } from "@/domain/build/models/allocation/Allocation";
import { type WeightedPathsResult, materializePath } from "@/domain/build/algorithms/pathfinding";

export interface MergeWeightedPathsIntoNodeStateParams {
  nodeStateById: Map<NodeId, AllocationNodeState>;
  weightedPaths: WeightedPathsResult;
}

export function applyWeightedPathsToNodeState({
  nodeStateById,
  weightedPaths,
}: MergeWeightedPathsIntoNodeStateParams): void {
  for (const [nodeId, nodeState] of nodeStateById) {
    const pathCost = weightedPaths.distanceByNodeId.get(nodeId) ?? null;

    if (pathCost === null) {
      nodeState.pathCost = null;
      nodeState.path = null;
      nodeState.reachable = false;
      continue;
    }

    nodeState.pathCost = pathCost;
    nodeState.path = materializePath(nodeId, weightedPaths.predecessorByNodeId);

    if (nodeState.path.length > 0) {
      nodeState.reachable = true;
    }
  }
}
