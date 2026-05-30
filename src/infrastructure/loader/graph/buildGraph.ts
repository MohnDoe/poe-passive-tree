import type { EdgeKey } from "@/domain/graph/GraphEdge";
import type { AscendancyId } from "@/domain/graph/PassiveAscendancy";
import type { ClassId } from "@/domain/graph/PassiveClass";
import type { NodeId, PassiveNode } from "@/domain/graph/PassiveNode";
import type { MappedPassiveTree } from "@/infrastructure/passiveTree/mapping/MappedPassiveTree";
import type { PassiveGraph, PassiveTreeAdjacency } from "@/domain/graph/PassiveGraph";
import { buildAdjacency } from "./buildAdjacency";
import { buildEdges } from "./buildEdges";
import { buildRegionIndexes } from "./buildRegions";
import { buildAscendancyStartNodeIds, buildStartNodeIndexes } from "./buildStartNodes";

export function buildGraph(input: MappedPassiveTree): PassiveGraph {
  const nodesById: ReadonlyMap<NodeId, PassiveNode> = input.nodesById;
  const edges = buildEdges(nodesById);
  const adjacency: PassiveTreeAdjacency = buildAdjacency(nodesById);

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
    nodesById,

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

    getBuildRootNodeIds(classId: ClassId | null, ascendancyId: AscendancyId | null) {
      const startNodeIds = this.getBuildStartNodeIds(classId, ascendancyId);

      const rootNodeIds = new Set<NodeId>();
      for (const startNodeId of startNodeIds) {
        const neighbors = adjacency.get(startNodeId);
        if (!neighbors) continue;
        for (const neighborId of neighbors) {
          const neighbor = nodesById.get(neighborId);
          if (neighbor && neighbor.kind !== "classStart" && neighbor.kind !== "ascendancyStart") {
            rootNodeIds.add(neighborId);
          }
        }
      }

      return rootNodeIds;
    },
    getBuildStartNodeIds(classId: ClassId | null, ascendancyId: AscendancyId | null) {
      const classStartNodeIds = this.getClassStartNodeIds(classId);
      const ascendancyStartNodeIds = this.getAscendancyStartNodeIds(ascendancyId);

      return new Set([...classStartNodeIds, ...ascendancyStartNodeIds]);
    },
    getClassStartNodeIds(classId: ClassId | null) {
      if (classId === null) return new Set();
      return startNodeIdsByClassId.get(classId) ?? new Set();
    },
    getAscendancyStartNodeIds(ascendancyId: AscendancyId | null) {
      if (ascendancyId === null) return new Set();
      return ascendancyStartNodeIdsByAscendancyId.get(ascendancyId) ?? new Set();
    },
    //TODO: remove query isAscendancyValidForClass
    isValidAscendancyForClass(classId: ClassId, ascendancyId: AscendancyId) {
      return ascendancyIdsByClassId.get(classId)?.has(ascendancyId) ?? false;
    },
    computeEdgeKeysFromNodeIds(nodeIds: ReadonlySet<NodeId>): Set<EdgeKey> {
      const edgeKeys = new Set<EdgeKey>();
      for (const edge of edges) {
        if (!nodeIds.has(edge.source)) continue;
        if (!nodeIds.has(edge.target)) continue;
        edgeKeys.add(edge.key);
      }
      return edgeKeys;
    },
  };
}
