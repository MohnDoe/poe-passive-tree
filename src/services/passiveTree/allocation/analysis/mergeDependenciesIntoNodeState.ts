import type { NodeId } from "@/domain/graph/PassiveNode";
import type { AllocationNodeState } from "@/domain/build/models/allocation/Allocation";
import type { ComputeDependenciesResult } from "@/domain/build/algorithms/dependencies";

export interface MergeDependenciesIntoNodeStateParams {
  nodeStateById: Map<NodeId, AllocationNodeState>;
  dependencies: ComputeDependenciesResult;
}

export function mergeDependenciesIntoNodeState({
  nodeStateById,
  dependencies,
}: MergeDependenciesIntoNodeStateParams): void {
  for (const [nodeId, nodeState] of nodeStateById) {
    nodeState.dependsOn = dependencies.dependsOnByNodeId.get(nodeId) ?? new Set<NodeId>();
    nodeState.requiredBy = dependencies.requiredByNodeId.get(nodeId) ?? new Set<NodeId>();
  }
}
