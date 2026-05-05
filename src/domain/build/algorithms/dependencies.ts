import { canExpandTo } from "@/domain/build/algorithms/rules/traversal";
import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import type { NodeId } from "@/domain/graph/PassiveNode";

export interface ComputeConnectivityParams {
  graph: PassiveGraph;
  rootNodeIds: ReadonlySet<NodeId>;
  whitelistedNodeIds: ReadonlySet<NodeId>;
}

/**
 * Returns a list of all nodes that are connected to the roots (rootNodeIds)
 * and are in nodeIdsWhitelist
 *
 */
export function computeConnectivity({
  graph,
  rootNodeIds,
  whitelistedNodeIds,
}: ComputeConnectivityParams): Set<NodeId> {
  const connectedNodeIds = new Set<NodeId>();
  const queue: NodeId[] = [...rootNodeIds];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (connectedNodeIds.has(nodeId)) continue;

    const node = graph.nodesById.get(nodeId);
    if (!node) continue;

    if (!whitelistedNodeIds.has(nodeId) && !rootNodeIds.has(nodeId)) continue;

    connectedNodeIds.add(nodeId);

    for (const neighborId of graph.adjacency.get(nodeId) ?? []) {
      const neighbor = graph.nodesById.get(neighborId);
      if (!neighbor) continue;
      if (!whitelistedNodeIds.has(neighborId)) continue;

      if (!canExpandTo(graph, node, neighbor)) continue;

      queue.push(neighborId);
    }
  }

  return connectedNodeIds;
}

export interface ComputeDependenciesParams {
  graph: PassiveGraph;
  allocatedNodeIds: ReadonlySet<NodeId>;
  rootNodeIds: ReadonlySet<NodeId>;
}

export interface ComputeDependenciesResult {
  dependsOnByNodeId: Map<NodeId, Set<NodeId>>;
  requiredByNodeId: Map<NodeId, Set<NodeId>>;
}

export function computeDependencies({
  graph,
  allocatedNodeIds,
  rootNodeIds,
}: ComputeDependenciesParams): ComputeDependenciesResult {
  const dependsOnByNodeId = new Map<NodeId, Set<NodeId>>();
  const requiredByNodeId = new Map<NodeId, Set<NodeId>>();

  for (const nodeId of allocatedNodeIds) {
    dependsOnByNodeId.set(nodeId, new Set<NodeId>());
    requiredByNodeId.set(nodeId, new Set<NodeId>());
  }

  for (const candidateId of allocatedNodeIds) {
    // roots can't be removed
    if (rootNodeIds.has(candidateId)) continue;

    const hypothetical = new Set(allocatedNodeIds);
    hypothetical.delete(candidateId);

    const stillReachableIds = computeConnectivity({
      graph,
      rootNodeIds,
      whitelistedNodeIds: hypothetical,
    });

    for (const nodeId of allocatedNodeIds) {
      if (nodeId === candidateId) continue;
      if (!stillReachableIds.has(nodeId)) {
        dependsOnByNodeId.get(nodeId)!.add(candidateId);
        requiredByNodeId.get(candidateId)!.add(nodeId);
      }
    }
  }

  return {
    dependsOnByNodeId,
    requiredByNodeId,
  };
}
