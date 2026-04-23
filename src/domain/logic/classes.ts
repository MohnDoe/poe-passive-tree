import type { ClassId } from "../models/passiveClass";
import type { NodeId } from "../models/passiveNode";
import type { PassiveTree } from "../models/passiveTree";

export function getStartNodeIds(tree: PassiveTree, classId: ClassId): Set<NodeId> {
  return tree.classes.get(classId)?.startNodeIds ?? new Set<NodeId>();
}
