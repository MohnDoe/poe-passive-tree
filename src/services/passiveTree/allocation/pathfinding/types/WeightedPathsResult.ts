import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

export interface WeightedPathsResult {
  distanceByNodeId: Map<NodeId, number>;
  pathByNodeId: Map<NodeId, NodeId[]>;
}
