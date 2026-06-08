import { makeEdgeKey } from "@/domain/graph/edgeKeys";
import type { EdgeKey } from "@/domain/graph/GraphEdge";
import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
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

export function computeRefundEdgeKeys(
  refundedNodeIds: ReadonlySet<NodeId>,
  allocatedNodeIds: ReadonlySet<NodeId>,
  graph: PassiveGraph,
): Set<EdgeKey> {
  const edgeKeys = new Set<EdgeKey>();

  for (const refundedNodeId of refundedNodeIds) {
    const neighbors = graph.adjacency.get(refundedNodeId) ?? [];
    for (const neighborId of neighbors) {
      // Include edge if neighbor is either:
      // - also refunded (internal edge within the cluster)
      // - allocated but not refunded (the "anchor" edge to the remaining tree)
      if (refundedNodeIds.has(neighborId) || allocatedNodeIds.has(neighborId)) {
        edgeKeys.add(makeEdgeKey(refundedNodeId, neighborId));
      }
    }
  }

  return edgeKeys;
}
