import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

export interface ComputeConnectivityParams {
  graph: PassiveGraph;
  rootNodeIds: ReadonlySet<NodeId>;
  allocatedNodeIds: ReadonlySet<NodeId>;
}

export interface ComputeDependenciesParams {
  pathByNodeId: Map<NodeId, NodeId[]>;
  allocatedNodeIds: ReadonlySet<NodeId>;
}

export interface ComputeDependenciesResult {
  dependsOnByNodeId: Map<NodeId, Set<NodeId>>;
  requiredByNodeId: Map<NodeId, Set<NodeId>>;
}

export function computeConnectivity({
  graph,
  rootNodeIds,
  allocatedNodeIds,
}: ComputeConnectivityParams): Set<NodeId> {
  const connectedNodeIds = new Set<NodeId>();
  const queue: NodeId[] = [...rootNodeIds];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (connectedNodeIds.has(nodeId)) continue;

    const node = graph.nodesById.get(nodeId);
    if (!node) continue;

    if (!allocatedNodeIds.has(nodeId) && !rootNodeIds.has(nodeId)) continue;

    connectedNodeIds.add(nodeId);

    for (const neighborId of graph.adjacency.get(nodeId) ?? []) {
      const neighbor = graph.nodesById.get(neighborId);
      if (!neighbor) continue;
      if (!allocatedNodeIds.has(neighborId)) continue;
      if (neighbor.kind === "mastery") continue;
      if (neighbor.kind === "classStart" || neighbor.kind === "ascendancyStart") continue;

      queue.push(neighborId);
    }
  }

  return connectedNodeIds;
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
