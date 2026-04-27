import type { AllocationNodeState } from "@/domain/build/allocation/Allocation";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

export interface ComputeDependenciesParams {
  nodeStateById: Map<NodeId, AllocationNodeState>;
  allocatedNodeIds: Set<NodeId>;
}

export interface ComputeDependenciesResult {
  dependsOnByNodeId: Map<NodeId, Set<NodeId>>;
  requiredByNodeId: Map<NodeId, Set<NodeId>>;
}

export function computeDependencies({
  nodeStateById,
  allocatedNodeIds,
}: ComputeDependenciesParams): ComputeDependenciesResult {
  const dependsOnByNodeId = new Map<NodeId, Set<NodeId>>();
  const requiredByNodeId = new Map<NodeId, Set<NodeId>>();

  for (const nodeId of nodeStateById.keys()) {
    dependsOnByNodeId.set(nodeId, new Set<NodeId>());
    requiredByNodeId.set(nodeId, new Set<NodeId>());
  }

  for (const nodeId of allocatedNodeIds) {
    const nodeState = nodeStateById.get(nodeId);
    if (!nodeState) continue;

    const path = nodeState.path ?? [nodeId];
    const dependsOn = dependsOnByNodeId.get(nodeId)!;

    for (const dependencyNodeId of path) {
      dependsOn.add(dependencyNodeId);
    }
  }

  for (const [nodeId, dependsOn] of dependsOnByNodeId) {
    for (const dependencyNodeId of dependsOn) {
      const requiredBy = requiredByNodeId.get(dependencyNodeId);
      if (!requiredBy) continue;

      requiredBy.add(nodeId);
    }
  }

  return {
    dependsOnByNodeId,
    requiredByNodeId,
  };
}
