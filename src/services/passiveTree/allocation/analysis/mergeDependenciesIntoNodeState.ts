import type { AllocationNodeState } from "@/domain/build/allocation/Allocation";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import type { ComputeDependenciesResult } from "./computeDependencies";

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

    if (!nodeState.allocated && nodeState.allocated !== null) {
      nodeState.allocatable = true;
    }
  }
}
