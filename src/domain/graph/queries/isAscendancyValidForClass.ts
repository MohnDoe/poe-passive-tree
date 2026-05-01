import type { AscendancyId } from "../PassiveAscendancy";
import type { ClassId } from "../PassiveClass";
import type { PassiveGraph } from "../PassiveGraph";

export function isAscendancyValidForClass(
  graph: PassiveGraph,
  classId: ClassId,
  ascendancyId: AscendancyId,
): boolean {
  return graph.ascendancyIdsByClassId.get(classId)?.has(ascendancyId) ?? false;
}
