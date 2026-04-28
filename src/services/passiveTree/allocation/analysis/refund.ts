import type { AllocationSnapshot } from "@/domain/build/allocation/Allocation";
import type { EdgeKey } from "@/domain/passiveGraph/GraphEdge";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import { makeEdgeKey } from "../../runtime/graph/buildEdges";

// Returns all the nodes that would be refunded in order to refund the input node
function computeRefundClosure(
  nodeId: NodeId,
  nodeStateById: AllocationSnapshot["nodeStateById"],
): Set<NodeId> {
  const out = new Set<NodeId>();
  const queue: NodeId[] = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (out.has(current)) continue;

    const nodeState = nodeStateById.get(current);
    if (!nodeState) continue;
    if (!nodeState.allocated) continue;
    out.add(current);

    for (const dependantId of nodeState.requiredBy) {
      if (!out.has(dependantId)) {
        queue.push(dependantId);
      }
    }
  }

  return out;
}

function computeRefundPath(
  refundedNodeIds: Set<NodeId>,
  nodeStateById: AllocationSnapshot["nodeStateById"],
): Set<EdgeKey> {
  const edgeKeys = new Set<EdgeKey>();

  for (const refundedNodeId of refundedNodeIds) {
    const nodeState = nodeStateById.get(refundedNodeId);
    if (!nodeState?.path) continue;

    for (let i = 0; i < nodeState.path.length - 1; i++) {
      const aId = nodeState.path[i];
      const bId = nodeState.path[i + 1];

      if (!aId || !refundedNodeIds.has(aId)) continue;
      if (!bId || !refundedNodeIds.has(bId)) continue;

      edgeKeys.add(makeEdgeKey(aId, bId));
    }
  }

  return edgeKeys;
}

export interface RefundAnalysis {
  canRefund: boolean;
  refundedNodeIds: ReadonlySet<NodeId>;
  refundedEdgeKeys: ReadonlySet<EdgeKey>;
}

export function analyzeRefundTarget(
  nodeId: NodeId,
  nodeStateById: AllocationSnapshot["nodeStateById"],
): RefundAnalysis {
  const nodeState = nodeStateById.get(nodeId);

  if (!nodeState?.allocated) {
    return {
      canRefund: false,
      refundedNodeIds: new Set(),
      refundedEdgeKeys: new Set(),
    };
  }

  const refundedNodeIds = computeRefundClosure(nodeId, nodeStateById);
  const refundedEdgeKeys = computeRefundPath(refundedNodeIds, nodeStateById);

  return {
    canRefund: refundedNodeIds.size > 0,
    refundedNodeIds,
    refundedEdgeKeys,
  };
}
