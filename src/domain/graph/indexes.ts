import { buildFullAdjacency, buildMainAdjacency, buildAscendancyAdjacency } from "./adjacency";
import { finalizedNodes, type NormalizedNodes } from "@/data/mapping/nodes";
import { buildAscendancySubregionByNodeIds } from "./ascendancy";

export function buildGraphIndexes(nodes: NormalizedNodes) {
  const full = buildFullAdjacency(nodes);

  const subregionByNodeId = buildAscendancySubregionByNodeIds(nodes, full);

  const nodesById = finalizedNodes(nodes, subregionByNodeId);

  return {
    nodesById,
    adjacency: {
      full,
      main: buildMainAdjacency(nodesById),
      ascendancy: buildAscendancyAdjacency(nodesById)
    }
  }
}
