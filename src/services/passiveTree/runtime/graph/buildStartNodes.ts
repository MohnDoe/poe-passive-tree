import type { MappedPassiveTree } from "@/data/mapping/MappedPassiveTree";
import type { AscendancyId } from "@/domain/passiveGraph/PassiveAscendancy";
import type { ClassId } from "@/domain/passiveGraph/PassiveClass";
import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

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

export function buildAscendancyStartNodeIds(input: MappedPassiveTree): Set<NodeId> {
  const ids = new Set<NodeId>();

  for (const [nodeId, node] of input.nodesById) {
    if (node.kind === "ascendancyStart") {
      ids.add(nodeId);
    }
  }

  return ids;
}
