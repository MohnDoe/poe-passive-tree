import type { PassiveTreeNodeDto } from "@/data/dto/nodes.dto";
import type { NodeId, AscendancySubregion } from "../models/passiveNode";
import type { PassiveTreeAdjacency } from "../models/passiveTree";
import { traverseAscendancyRegion } from "./traversal";
import type { NormalizedNodes } from "@/data/mapping/nodes.mapper";

export function isAscendancySeed(node: PassiveTreeNodeDto) {
  return node.isAscendancyStart || false;
}

export function collectAscendancySeedNodeIds(nodes: NormalizedNodes): Set<NodeId> {
  const ids = new Set<NodeId>();

  for (const [nodeId, node] of nodes) {
    if (node.kind === "ascendancyStart") {
      ids.add(nodeId);
    }
  }

  return ids;
}

export function buildAscendancySubregionByNodeIds(
  nodes: NormalizedNodes,
  fullAdj: PassiveTreeAdjacency,
): Map<NodeId, AscendancySubregion> {
  const subregionByNodeId = new Map<NodeId, AscendancySubregion>();
  const seedIds = collectAscendancySeedNodeIds(nodes);

  for (const seedId of seedIds) {
    const seedNode = nodes.get(seedId);
    if (!seedNode) continue;

    const subregion = seedNode.ascendancyName;
    if (!subregion) continue;

    subregionByNodeId.set(seedId, subregion);

    const visited = traverseAscendancyRegion(seedNode, fullAdj, nodes);

    for (const nodeId of visited) {
      subregionByNodeId.set(nodeId, subregion);
    }
  }

  return subregionByNodeId;
}

type Edge = readonly [NodeId, NodeId];

export function uniqueEdgesFromAdjacency(adj: PassiveTreeAdjacency): Edge[] {
  const edges: Edge[] = [];

  for (const [nodeAId, neighbors] of adj) {
    for (const nodeBId of neighbors) {
      if (nodeAId < nodeBId) {
        edges.push([nodeAId, nodeBId]);
      }
    }
  }

  return edges;
}
