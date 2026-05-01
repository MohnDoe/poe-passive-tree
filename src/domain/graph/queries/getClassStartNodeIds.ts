import type { ClassId } from "../PassiveClass";
import type { PassiveGraph } from "../PassiveGraph";
import type { NodeId } from "../PassiveNode";

export function getClassStartNodeIds(
  graph: PassiveGraph,
  classId: ClassId | null,
): ReadonlySet<NodeId> {
  if (classId === null) return new Set();

  return graph.startNodeIdsByClassId.get(classId) ?? new Set();
}
