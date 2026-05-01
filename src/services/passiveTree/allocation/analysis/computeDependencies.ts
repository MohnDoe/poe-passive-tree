import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

export interface ComputeDependenciesParams {
  pathByNodeId: Map<NodeId, NodeId[]>;
  allocatedNodeIds: ReadonlySet<NodeId>;
}

export interface ComputeDependenciesResult {
  dependsOnByNodeId: Map<NodeId, Set<NodeId>>;
  requiredByNodeId: Map<NodeId, Set<NodeId>>;
}

export function computeDependencies({
  pathByNodeId,
  allocatedNodeIds,
}: ComputeDependenciesParams): ComputeDependenciesResult {
  const dependsOnByNodeId = new Map<NodeId, Set<NodeId>>();
  const requiredByNodeId = new Map<NodeId, Set<NodeId>>();

  for (const nodeId of pathByNodeId.keys()) {
    dependsOnByNodeId.set(nodeId, new Set<NodeId>());
    requiredByNodeId.set(nodeId, new Set<NodeId>());
  }

  for (const nodeId of allocatedNodeIds) {
    const path = pathByNodeId.get(nodeId) ?? [];
    const dependsOn = dependsOnByNodeId.get(nodeId)!;

    for (const dependencyNodeId of path) {
      if (dependencyNodeId === nodeId) continue;
      dependsOn.add(dependencyNodeId);
    }
  }

  for (const [nodeId, dependsOn] of dependsOnByNodeId) {
    for (const dependencyNodeId of dependsOn) {
      requiredByNodeId.get(dependencyNodeId)?.add(nodeId);
    }
  }

  return {
    dependsOnByNodeId,
    requiredByNodeId,
  };
}
