import { getNeighborIds } from "../graph/traversal";
import type { ClassId } from "../models/passiveClass";
import type { NodeId } from "../models/passiveNode";
import type { PassiveTree } from "../models/passiveTree";
import { getStartNodeIds } from "./classes";

export function canAllocate(
  tree: PassiveTree,
  targetNodeId: NodeId,
  allocatedNodeIds: Set<NodeId>,
  classId: ClassId,
): boolean {
  if (allocatedNodeIds.has(targetNodeId)) return false;
  const startIds = getStartNodeIds(tree, classId);
  if (startIds.has(targetNodeId)) return true;

  for (const allocatedId of allocatedNodeIds) {
    const neighborIds = getNeighborIds(allocatedId, tree.adjacency);

    if (neighborIds.has(targetNodeId)) return true;
  }

  return false;
}
