import type { MappedPassiveTree } from "@/data/mapping/MappedPassiveTree";
import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import { buildAdjacency } from "./buildAdjacency";
import { buildEdges } from "./buildEdges";
import { buildRegionIndexes } from "./buildRegions";
import { buildAscendancyStartNodeIds, buildStartNodeIndexes } from "./buildStartNodes";

export function buildGraph(input: MappedPassiveTree): PassiveGraph {
  const edges = buildEdges(input.nodesById);
  const adjacency = buildAdjacency(input.nodesById);

  const ascendancyStartNodeIds = buildAscendancyStartNodeIds(input);

  const { regionByNodeId, subregionByNodeId } = buildRegionIndexes(
    input,
    ascendancyStartNodeIds,
    adjacency,
  );

  const { allStartNodeIds, classByStartNodeId, startNodeIdsByClassId, ascendancyIdsByClassId } =
    buildStartNodeIndexes(input);

  return {
    classesById: input.classesById,
    groupsById: input.groupsById,
    nodesById: input.nodesById,

    adjacency,
    edges,
    ascendancyStartNodeIds,
    allStartNodeIds,
    classByStartNodeId,
    startNodeIdsByClassId,

    ascendancyIdsByClassId,

    regionByNodeId,
    subregionByNodeId,

    bounds: input.bounds,
  };
}
