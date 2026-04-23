import { getNeighborIds } from "../graph/traversal";
import type { NodeId } from "../models/passiveNode";
import type { PassiveTreeAdjacency } from "../models/passiveTree";

export function canAllocate(
  nodeId: NodeId,
  allocatedIds: Set<NodeId>,
  startIds: Set<NodeId>,
  adjacency: PassiveTreeAdjacency,
): boolean {
  if (allocatedIds.has(nodeId)) return false;
  if (startIds.has(nodeId)) return true;

  for (const allocatedId of allocatedIds) {
    const neighborIds = getNeighborIds(allocatedId, adjacency);

    if (neighborIds.has(nodeId)) return true;
  }

  return false;
}
