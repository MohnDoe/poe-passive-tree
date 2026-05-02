import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import type { NodeId } from "@/domain/graph/PassiveNode";
import { canTraverse } from "@/domain/build/algorithms/rules/traversal";
import { Deque } from "@/shared/collections/Deque";

export interface ComputeWeightedPathsParams {
  graph: PassiveGraph;
  rootNodeIds: ReadonlySet<NodeId>;
  allocatedNodeIds: ReadonlySet<NodeId>;
}

export interface WeightedPathsResult {
  // cheapest cost from active root
  distanceByNodeId: Map<NodeId, number>;
  // used to rebuild shortest path
  predecessorByNodeId: Map<NodeId, NodeId | null>;
}

export function computeWeightedPaths({
  rootNodeIds,
  allocatedNodeIds,
  graph,
}: ComputeWeightedPathsParams): WeightedPathsResult {
  const distanceByNodeId: WeightedPathsResult["distanceByNodeId"] = new Map();
  const predecessorByNodeId: WeightedPathsResult["predecessorByNodeId"] = new Map();

  const deque = new Deque<NodeId>();

  for (const rootId of rootNodeIds) {
    distanceByNodeId.set(rootId, 0);
    predecessorByNodeId.set(rootId, null);
    deque.pushBack(rootId);
  }

  while (!deque.isEmpty()) {
    const currentId = deque.popFront();
    if (!currentId) continue;

    const currentNode = graph.nodesById.get(currentId);
    if (!currentNode) continue;

    const currentDistance = distanceByNodeId.get(currentId);
    if (currentDistance === undefined) continue;

    for (const neighborId of graph.adjacency.get(currentId) ?? []) {
      const neighborNode = graph.nodesById.get(neighborId);
      if (!neighborNode) continue;

      if (!canTraverse(graph, currentNode, neighborNode)) continue;

      // allocated nodes are free
      const stepCost = allocatedNodeIds.has(neighborId) ? 0 : 1;
      const nextDistance = currentDistance + stepCost;
      const previousDistance = distanceByNodeId.get(neighborId);

      if (previousDistance !== undefined && previousDistance <= nextDistance) {
        continue;
      }

      distanceByNodeId.set(neighborId, nextDistance);
      predecessorByNodeId.set(neighborId, currentId);

      if (stepCost === 0) {
        deque.pushFront(neighborId);
      } else {
        deque.pushBack(neighborId);
      }
    }
  }

  return {
    distanceByNodeId,
    predecessorByNodeId,
  };
}

export function materializePath(
  targetNodeId: NodeId,
  predecessorByNodeId: ReadonlyMap<NodeId, NodeId | null>,
  allocatedNodeIds: ReadonlySet<NodeId>,
): NodeId[] {
  const reversedPath: NodeId[] = [];
  let currentNodeId: NodeId | null | undefined = targetNodeId;

  while (currentNodeId !== undefined && currentNodeId !== null) {
    reversedPath.push(currentNodeId);
    currentNodeId = predecessorByNodeId.get(currentNodeId) ?? null;
  }

  reversedPath.reverse();

  // Return the anchor (last allocated node) + all unallocated nodes
  const firstUnallocated = reversedPath.findIndex((id) => !allocatedNodeIds.has(id));
  if (firstUnallocated === -1) return [];

  // Include the allocated node just before the gap as anchor for edge drawing
  const anchorIndex = Math.max(0, firstUnallocated - 1);
  return reversedPath.slice(anchorIndex);
}
