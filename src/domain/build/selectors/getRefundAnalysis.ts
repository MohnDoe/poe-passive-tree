import type { EdgeKey } from "@/domain/graph/GraphEdge";
import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import type { NodeId } from "@/domain/graph/PassiveNode";
import { computeRefundClosure, computeRefundEdgeKeys } from "../algorithms/refund";
import type { AllocationState } from "../models/allocation/Allocation";

export interface RefundAnalysis {
  canRefund: boolean;
  refundedNodeIds: ReadonlySet<NodeId>;
  refundedEdgeKeys: ReadonlySet<EdgeKey>;
}

export function getRefundAnalysis(
  nodeId: NodeId,
  nodeStateById: AllocationState["nodeStateById"],
  graph: PassiveGraph,
): RefundAnalysis {
  const nodeState = nodeStateById.get(nodeId);

  if (!nodeState?.allocated) {
    return {
      canRefund: false,
      refundedNodeIds: new Set(),
      refundedEdgeKeys: new Set(),
    };
  }

  const allocatedNodeIds = new Set<NodeId>();
  const pathByNodeId = new Map<NodeId, NodeId[]>();
  const requiredByNodeId = new Map<NodeId, Set<NodeId>>();

  for (const [nodeId, nodeState] of nodeStateById) {
    if (nodeState.allocated) {
      allocatedNodeIds.add(nodeId);
    }
    pathByNodeId.set(nodeId, nodeState.path ?? []);
    requiredByNodeId.set(nodeId, new Set(nodeState.requiredBy ?? []));
  }

  const refundedNodeIds = computeRefundClosure(nodeId, allocatedNodeIds, requiredByNodeId);
  const refundedEdgeKeys = computeRefundEdgeKeys(refundedNodeIds, allocatedNodeIds, graph);

  return {
    canRefund: refundedNodeIds.size > 0,
    refundedNodeIds,
    refundedEdgeKeys,
  };
}
