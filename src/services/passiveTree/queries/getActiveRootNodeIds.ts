import type { BuildState } from "@/domain/build/models/BuildState";
import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import { getClassStartNodeIds } from "@/domain/passiveGraph/queries/getClassStartNodeIds";

export function getActiveRootNodeIds(graph: PassiveGraph, build: BuildState): ReadonlySet<NodeId> {
  const roots = new Set(getClassStartNodeIds(graph, build.activeClassId));

  if (build.activeAscendancy !== null) {
    for (const nodeId of graph.ascendancyStartNodeIds) {
      const node = graph.nodesById.get(nodeId);
      if (node?.ascendancyName === build.activeAscendancy) {
        roots.add(nodeId);
      }
    }
  }

  return roots;
}
