import type { AscendancyId } from "../PassiveAscendancy";
import type { ClassId } from "../PassiveClass";
import type { PassiveGraph } from "../PassiveGraph";
import type { NodeId } from "../PassiveNode";
import { getClassStartNodeIds } from "./getClassStartNodeIds";

export function getActiveRootNodeIds(
  graph: PassiveGraph,
  activeClassId: ClassId | null,
  activeAscendancy: AscendancyId | null,
): ReadonlySet<NodeId> {
  const roots = new Set(getClassStartNodeIds(graph, activeClassId));

  if (activeAscendancy !== null) {
    const ascendancyStartNodeIds =
      graph.ascendancyStartNodeIdsByAscendancyId.get(activeAscendancy) ?? new Set();

    for (const nodeId of ascendancyStartNodeIds) roots.add(nodeId);
  }

  return roots;
}
