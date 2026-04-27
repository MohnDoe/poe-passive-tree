import type { AllocationSnapshot } from "@/domain/build/allocation/Allocation";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

// Returns all the nodes that would be refunded in order to refund the input node
export function computeRefundClosure(
  nodeId: NodeId,
  nodeStateById: AllocationSnapshot["nodeStateById"],
): Set<NodeId> {
  const out = new Set<NodeId>();
  const queue: NodeId[] = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (out.has(current)) continue;

    out.add(current);

    const nodeState = nodeStateById.get(current);
    if (!nodeState) continue;

    for (const dependantId of nodeState.requiredBy) {
      if (!out.has(dependantId)) {
        queue.push(dependantId);
      }
    }
  }

  return out;
}
