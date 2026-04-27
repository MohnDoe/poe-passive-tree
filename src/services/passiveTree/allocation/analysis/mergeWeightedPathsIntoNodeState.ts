import type { AllocationNodeState } from "@/domain/build/allocation/Allocation";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import type { WeightedPathsResult } from "../pathfinding/types/WeightedPathsResult";

export interface MergeWeightedPathsIntoNodeStateParams {
  nodeStateById: Map<NodeId, AllocationNodeState>;
  weightedPaths: WeightedPathsResult;
}

export function mergeWeightedPathsIntoNodeState({
  nodeStateById,
  weightedPaths,
}: MergeWeightedPathsIntoNodeStateParams): void {
  for (const [nodeId, cost] of weightedPaths.distanceByNodeId) {
    const nodeState = nodeStateById.get(nodeId);
    if (!nodeState) continue;

    nodeState.pathCost = cost;
    nodeState.path = weightedPaths.pathByNodeId.get(nodeId) ?? null;
  }
}
