import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import { getClassStartNodeIds } from "@/domain/passiveGraph/queries/getClassStartNodeIds";
import type { AscendancyId } from "../PassiveAscendancy";
import type { ClassId } from "../PassiveClass";

export function getActiveRootNodeIds(
  graph: PassiveGraph,
  activeClassId: ClassId | null,
  activeAscendancy: AscendancyId | null,
): ReadonlySet<NodeId> {
  const roots = new Set(getClassStartNodeIds(graph, activeClassId));

  if (activeAscendancy !== null) {
    for (const nodeId of graph.ascendancyStartNodeIds) {
      const node = graph.nodesById.get(nodeId);
      if (node?.ascendancyName === activeAscendancy) {
        roots.add(nodeId);
      }
    }
  }

  return roots;
}
