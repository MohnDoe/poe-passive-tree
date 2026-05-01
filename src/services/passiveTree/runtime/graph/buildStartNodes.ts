import type { MappedPassiveTree } from "@/infrastructure/mapping/MappedPassiveTree";
import type { AscendancyId } from "@/domain/graph/PassiveAscendancy";
import type { ClassId } from "@/domain/graph/PassiveClass";
import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import type { NodeId } from "@/domain/graph/PassiveNode";

interface StartNodeIndexes {
  startNodeIdsByClassId: PassiveGraph["startNodeIdsByClassId"];
  allStartNodeIds: PassiveGraph["allStartNodeIds"];
  classByStartNodeId: PassiveGraph["classByStartNodeId"];
  ascendancyIdsByClassId: PassiveGraph["ascendancyIdsByClassId"];
}

export function buildStartNodeIndexes(
  input: MappedPassiveTree,
  // adjacency: PassiveTreeAdjacency,
  // regionByNodeId: RegionIndexes["regionByNodeId"],
): StartNodeIndexes {
  const startNodeIdsByClassId = getStartNodeIdsByClassId(input);

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

  const ascendancyIdsByClassId = new Map<ClassId, Set<AscendancyId>>();

  for (const [classId, pClass] of input.classesById) {
    ascendancyIdsByClassId.set(classId, new Set<AscendancyId>(pClass.ascendancyIds));
  }

  return {
    allStartNodeIds,
    startNodeIdsByClassId,
    classByStartNodeId,
    ascendancyIdsByClassId,
  };
}

function getStartNodeIdsByClassId(
  input: MappedPassiveTree,
  // adjacency: PassiveTreeAdjacency,
  // regionByNodeId: RegionIndexes["regionByNodeId"],
): Map<ClassId, Set<NodeId>> {
  const out = new Map<ClassId, Set<NodeId>>();

  for (const [nodeId, node] of input.nodesById) {
    if (node.classStartIndex !== undefined) {
      const classId = node.classStartIndex;

      // only neighbors in the main tree are start node
      // const neighbors = [...getNeighborIds(nodeId, adjacency)].filter(
      //   (neighborId) => regionByNodeId.get(neighborId) == "main",
      // );
      const neighbors = [nodeId];

      if (!out.has(classId)) out.set(classId, new Set(neighbors));
    }
  }

  return out;
}

export interface AscendancyStartNodeIndexes {
  ascendancyStartNodeIds: PassiveGraph["ascendancyStartNodeIds"];
  ascendancyStartNodeIdsByAscendancyId: PassiveGraph["ascendancyStartNodeIdsByAscendancyId"];
}

export function buildAscendancyStartNodeIds(input: MappedPassiveTree): AscendancyStartNodeIndexes {
  const ascendancyStartNodeIds = new Set<NodeId>();
  const ascendancyStartNodeIdsByAscendancyId = new Map<AscendancyId, Set<NodeId>>();

  for (const [nodeId, node] of input.nodesById) {
    if (node.kind === "ascendancyStart") {
      ascendancyStartNodeIds.add(nodeId);

      if (node.ascendancyName) {
        if (!ascendancyStartNodeIdsByAscendancyId.get(node.ascendancyName))
          ascendancyStartNodeIdsByAscendancyId.set(node.ascendancyName, new Set());

        ascendancyStartNodeIdsByAscendancyId.set(
          node.ascendancyName,
          new Set([...ascendancyStartNodeIdsByAscendancyId.get(node.ascendancyName)!, nodeId]),
        );
      }
    }
  }

  return {
    ascendancyStartNodeIds,
    ascendancyStartNodeIdsByAscendancyId,
  };
}
