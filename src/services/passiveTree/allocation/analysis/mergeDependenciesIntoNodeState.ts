import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import type { ComputeDependenciesResult } from "./computeDependencies";
import type { AllocationNodeState } from "@/domain/build/models/allocation/Allocation";

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
