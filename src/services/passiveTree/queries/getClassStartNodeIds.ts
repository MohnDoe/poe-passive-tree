import type { ClassId } from "@/domain/passiveGraph/PassiveClass";
import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

export function getClassStartNodeIds(
  graph: PassiveGraph,
  classId: ClassId | null,
): ReadonlySet<NodeId> {
  if (classId === null) return new Set();

  return graph.startNodeIdsByClassId.get(classId) ?? new Set();
}
