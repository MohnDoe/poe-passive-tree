import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import { buildPathsFromRoot } from "./computePathsFromRoot";
import type { WeightedPathsResult } from "./types/WeightedPathsResult";

export interface ComputeWeightedPathsParams {
  graph: PassiveGraph;
  rootNodeIds: ReadonlySet<NodeId>;
  allocatedNodeIds: ReadonlySet<NodeId>;
}

export function computeWeightedPaths({
  rootNodeIds,
  allocatedNodeIds,
  graph,
}: ComputeWeightedPathsParams): WeightedPathsResult {
  const distanceByNodeId = new Map<NodeId, number>();
  const pathByNodeId = new Map<NodeId, NodeId[]>();

  for (const rootId of rootNodeIds) {
    const perRoot = buildPathsFromRoot({ rootId, allocatedNodeIds, graph });
    for (const [nodeId, cost] of perRoot.distanceByNodeId) {
      const previous = distanceByNodeId.get(nodeId);
      if (previous !== undefined && previous <= cost) continue;

      distanceByNodeId.set(nodeId, cost);
      pathByNodeId.set(nodeId, perRoot.pathByNodeId.get(nodeId) ?? []);
    }
  }

  return {
    distanceByNodeId,
    pathByNodeId,
  };
}
