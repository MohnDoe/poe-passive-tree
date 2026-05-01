import type { MappedPassiveTree } from "@/infrastructure/passiveTree/mapping/MappedPassiveTree";
import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import { buildAdjacency } from "./buildAdjacency";
import { buildEdges } from "./buildEdges";
import { buildRegionIndexes } from "./buildRegions";
import { buildAscendancyStartNodeIds, buildStartNodeIndexes } from "./buildStartNodes";

export function buildGraph(input: MappedPassiveTree): PassiveGraph {
  const edges = buildEdges(input.nodesById);
  const adjacency = buildAdjacency(input.nodesById);

  const { ascendancyStartNodeIds, ascendancyStartNodeIdsByAscendancyId } =
    buildAscendancyStartNodeIds(input);

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
    ascendancyStartNodeIdsByAscendancyId,

    regionByNodeId,
    subregionByNodeId,

    bounds: input.bounds,
  };
}
