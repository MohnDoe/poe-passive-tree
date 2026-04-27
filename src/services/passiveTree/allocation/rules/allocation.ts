import { getNeighborIds } from "./traversal";

import type { ClassId } from "@/domain/passiveGraph/PassiveClass";
import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

//TODO: delete this

export function canAllocate(
  graph: PassiveGraph,
  targetNodeId: NodeId,
  allocatedNodeIds: Set<NodeId>,
  classId: ClassId,
): boolean {
  if (allocatedNodeIds.has(targetNodeId)) return false;
  const startIds = graph.startNodeIdsByClassId.get(classId);
  if (startIds && startIds.has(targetNodeId)) return true;

  for (const allocatedId of allocatedNodeIds) {
    const neighborIds = getNeighborIds(allocatedId, graph.adjacency);

    if (neighborIds.has(targetNodeId)) return true;
  }

  return false;
}
