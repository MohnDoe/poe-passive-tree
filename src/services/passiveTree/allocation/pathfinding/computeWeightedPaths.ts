import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import { Deque } from "../../runtime/graph/Deque";
import { canTraverse } from "../rules/traversal";

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
): NodeId[] {
  const reversedPath: NodeId[] = [];
  let currentNodeId: NodeId | null | undefined = targetNodeId;

  while (currentNodeId !== undefined && currentNodeId !== null) {
    reversedPath.push(currentNodeId);
    currentNodeId = predecessorByNodeId.get(currentNodeId) ?? null;
  }

  reversedPath.reverse();
  return reversedPath;
}
