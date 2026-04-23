import { type NormalizedNodes, finalizedNodes } from "@/data/mapping/nodes.mapper";
import { buildAscendancySubregionByNodeIds } from "./ascendancy";
import { extractEdges } from "./edges";
import { buildTraversalAdjacency } from "./traversal";
import type { PassiveTree } from "../models/passiveTree";

export function buildBaseGraph(nodes: NormalizedNodes) {
  const edges = extractEdges(nodes);
  const adjacency = buildTraversalAdjacency(nodes, edges);

  const subregionByNodeId = buildAscendancySubregionByNodeIds(nodes, adjacency);

  const nodesById = finalizedNodes(nodes, subregionByNodeId);

  return {
    nodesById,
    adjacency,
    edges,
  };
}

export function computeActiveGraph(tree: PassiveTree, activeAscendancy: string) {
  const edges = extractEdges(tree.nodesById);

  // dynamic edges
  //

  return {
    edges,
    adjacency: buildTraversalAdjacency(tree.nodesById, edges, activeAscendancy),
  };
}
