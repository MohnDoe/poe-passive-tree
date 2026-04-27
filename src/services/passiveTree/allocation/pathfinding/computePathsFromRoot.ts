import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import { canTraverse } from "../rules/traversal";
import type { WeightedPathsResult } from "./types/WeightedPathsResult";

export interface ComputePathsFromRootParams {
  graph: PassiveGraph;
  rootId: NodeId;
  allocatedNodeIds: ReadonlySet<NodeId>;
}

export function buildPathsFromRoot(params: ComputePathsFromRootParams): WeightedPathsResult {
  const rootId = params.rootId;
  const deque: NodeId[] = [rootId];
  const distanceByNodeId = new Map<NodeId, number>();
  const pathByNodeId = new Map<NodeId, NodeId[]>();

  distanceByNodeId.set(rootId, 0);
  pathByNodeId.set(rootId, []);

  while (deque.length > 0) {
    const currentId = deque.shift()!;
    const currentNode = params.graph.nodesById.get(currentId);
    if (!currentNode) continue;

    const currentDistance = distanceByNodeId.get(currentId)!;
    const currentPath = pathByNodeId.get(currentId)!;

    for (const neighborId of params.graph.adjacency.get(currentId) ?? []) {
      const neighbor = params.graph.nodesById.get(neighborId);
      if (!neighbor) continue;

      if (!canTraverse(currentNode, neighbor, currentDistance)) continue;

      const stepCost = params.allocatedNodeIds.has(neighborId) ? 0 : 1;
      const nextDistance = currentDistance + stepCost;
      const previousDistance = distanceByNodeId.get(neighborId);

      if (previousDistance !== undefined && previousDistance <= nextDistance) {
        continue;
      }

      distanceByNodeId.set(neighborId, nextDistance);
      pathByNodeId.set(neighborId, [neighborId, ...currentPath]);

      if (stepCost === 0) deque.unshift(neighborId);
      else deque.push(neighborId);
    }
  }

  return {
    distanceByNodeId,
    pathByNodeId,
  };
}
