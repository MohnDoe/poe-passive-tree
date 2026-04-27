import type { MappedPassiveTree } from "@/data/mapping/MappedPassiveTree";
import type { ClassId } from "@/domain/passiveGraph/PassiveClass";
import type { PassiveGraph, PassiveTreeAdjacency } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import { getNeighborIds } from "../../allocation/rules/traversal";
import type { RegionIndexes } from "./buildRegions";

interface StartNodeIndexes {
  startNodeIdsByClassId: PassiveGraph["startNodeIdsByClassId"];
  allStartNodeIds: PassiveGraph["allStartNodeIds"];
  classByStartNodeId: PassiveGraph["classByStartNodeId"];
}

export function buildStartNodeIndexes(
  input: MappedPassiveTree,
  adjacency: PassiveTreeAdjacency,
  regionByNodeId: RegionIndexes["regionByNodeId"],
): StartNodeIndexes {
  const startNodeIdsByClassId = getStartNodeIdsByClassId(input, adjacency, regionByNodeId);

  // flatten the Map<ClassId, Set<NodeId>> into a Set<NodeId>
  const allStartNodeIds = new Set<NodeId>(
    Array.from(startNodeIdsByClassId.values()).flatMap((s) => Array.from(s)),
  );

  const classByStartNodeId = new Map();

  for (const [classId, startNodeIds] of startNodeIdsByClassId) {
    for (const nodeId of startNodeIds) {
      if (!classByStartNodeId.has(nodeId)) classByStartNodeId.set(nodeId, classId);
    }
  }

  return {
    allStartNodeIds,
    startNodeIdsByClassId,
    classByStartNodeId,
  };
}

function getStartNodeIdsByClassId(
  input: MappedPassiveTree,
  adjacency: PassiveTreeAdjacency,
  regionByNodeId: RegionIndexes["regionByNodeId"],
): Map<ClassId, Set<NodeId>> {
  const out = new Map<ClassId, Set<NodeId>>();

  for (const [nodeId, node] of input.nodesById) {
    if (node.classStartIndex !== undefined) {
      const classId = node.classStartIndex;

      // only neighbors in the main tree are start node
      const neighbors = [...getNeighborIds(nodeId, adjacency)].filter(
        (neighborId) => regionByNodeId.get(neighborId) == "main",
      );

      if (!out.has(classId)) out.set(classId, new Set(neighbors));
    }
  }

  return out;
}

export function buildAscendancyStartNodeIds(input: MappedPassiveTree): Set<NodeId> {
  const ids = new Set<NodeId>();

  for (const [nodeId, node] of input.nodesById) {
    if (node.kind === "ascendancyStart") {
      ids.add(nodeId);
    }
  }

  return ids;
}
