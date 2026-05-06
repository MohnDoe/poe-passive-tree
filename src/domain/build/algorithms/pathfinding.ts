import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import type { NodeId } from "@/domain/graph/PassiveNode";
import { canExpandTo } from "@/domain/build/algorithms/rules/traversal";
import { Deque } from "@/shared/collections/Deque";

export interface ComputeWeightedPathsParams {
  graph: PassiveGraph;
  rootNodeIds: ReadonlySet<NodeId>;
  // Allocated nodes are treated as free to traverse (cost = 0)
  allocatedNodeIds: ReadonlySet<NodeId>;
}

export interface WeightedPathsResult {
  // cheapest cost to reach each node from any root (rootNodeIds)
  // "cost" or "distance" = number of unallocated nodes on the path
  distanceByNodeId: Map<NodeId, number>;
  // For each node, the node that preceded it on the cheapest path from a root
  // Used by `materializePath` to reconstruct the path
  // Root nodes don't have a predecessor (mapped to `null`)
  predecessorByNodeId: Map<NodeId, NodeId | null>;
}

/*
 * 0-1 BFS shortest-path from all roots simultaneously
 *
 * Weights are binary :
 *  - 0 if the neighbor is allocated
 *  - 1 if the neighbor is not allocated (it costs a passive point to add)
 *
 * Zero-cost neighbors are pushed to the `front` of the deque, 1-cost neighbors to the `back`.
 * Maintaining the BFS distance invariant without needing a priority queue
 *
 * The result is used to preview the cheapest path from a player's current allocation to a hovered
 * target node.
 *
 * Pretty cool and less expensive than Dijkstra : 0(V + E) < 0((V+E) log V)
 *
 */
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

      if (!canExpandTo(graph, currentNode, neighborNode)) continue;

      // allocated nodes are free : cost is 0
      const stepCost = allocatedNodeIds.has(neighborId) ? 0 : 1;
      const nextDistance = currentDistance + stepCost;
      const previousDistance = distanceByNodeId.get(neighborId);

      // Skip if we already found a path at least as cheap (or cheaper)
      if (previousDistance !== undefined && previousDistance <= nextDistance) {
        continue;
      }

      distanceByNodeId.set(neighborId, nextDistance);
      predecessorByNodeId.set(neighborId, currentId);

      // 0-cost neighbors go to the front to be processed before any 1-cost neighbors at the same
      // effective distance level
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
