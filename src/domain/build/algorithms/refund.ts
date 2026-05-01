import type { AllocationState } from "@/domain/build/models/allocation/Allocation";
import { makeEdgeKeysFromPath } from "@/domain/graph/edgeKeys";
import type { EdgeKey } from "@/domain/graph/GraphEdge";
import type { NodeId } from "@/domain/graph/PassiveNode";

// Returns all the nodes that would be refunded in order to refund the input node
export function computeRefundClosure(
  nodeId: NodeId,
  allocatedNodeIds: ReadonlySet<NodeId>,
  requiredByNodeId: ReadonlyMap<NodeId, Set<NodeId>>,
): Set<NodeId> {
  const out = new Set<NodeId>();
  const queue: NodeId[] = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (out.has(current)) continue;
    if (!allocatedNodeIds.has(current)) continue;

    out.add(current);

    for (const dependantId of requiredByNodeId.get(current) ?? []) {
      if (!out.has(dependantId)) queue.push(dependantId);
    }
  }

  return out;
}

function computeRefundEdgeKeys(
  refundedNodeIds: ReadonlySet<NodeId>,
  pathByNodeId: ReadonlyMap<NodeId, NodeId[]>,
): Set<EdgeKey> {
  const edgeKeys = new Set<EdgeKey>();

  for (const refundedNodeId of refundedNodeIds) {
    const path = pathByNodeId.get(refundedNodeId);
    if (!path) continue;

    for (const edgeKey of makeEdgeKeysFromPath({
      path,
      allowedNodeIds: refundedNodeIds,
    })) {
      edgeKeys.add(edgeKey);
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
  nodeStateById: AllocationState["nodeStateById"],
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
  const refundedEdgeKeys = computeRefundEdgeKeys(refundedNodeIds, pathByNodeId);

  return {
    canRefund: refundedNodeIds.size > 0,
    refundedNodeIds,
    refundedEdgeKeys,
  };
}
