import type { MappedPassiveTree } from "@/infrastructure/passiveTree/mapping/MappedPassiveTree";
import {
  getNeighborIds,
  isAscendancyTraversalNode,
} from "@/domain/build/algorithms/rules/traversal";
import type { PassiveGraph, PassiveTreeAdjacency } from "@/domain/graph/PassiveGraph";
import type {
  NodeId,
  PassiveNode,
  PassiveNodeRegion,
  PassiveNodeSubregion,
} from "@/domain/graph/PassiveNode";

export interface RegionIndexes {
  regionByNodeId: PassiveGraph["regionByNodeId"];
  subregionByNodeId: PassiveGraph["subregionByNodeId"];
}

export function buildRegionIndexes(
  input: MappedPassiveTree,
  ascendancyStartNodeIds: PassiveGraph["ascendancyStartNodeIds"],
  adjacendy: PassiveTreeAdjacency,
): RegionIndexes {
  const subregionByNodeId = new Map<NodeId, PassiveNodeSubregion>();
  const regionByNodeId = new Map<NodeId, PassiveNodeRegion>();

  // default all nodes to main region and no subregion
  for (const nodeId of input.nodesById.keys()) {
    subregionByNodeId.set(nodeId, null);
    regionByNodeId.set(nodeId, "main");
  }

  for (const seedId of ascendancyStartNodeIds) {
    const seedNode = input.nodesById.get(seedId);
    if (!seedNode) continue;

    const subregion = seedNode.ascendancyName;
    if (!subregion) continue;

    subregionByNodeId.set(seedId, subregion);
    regionByNodeId.set(seedId, "ascendancy");

    const discovered = discoverAscendancyNodes(seedNode, adjacendy, input.nodesById);

    for (const nodeId of discovered) {
      regionByNodeId.set(nodeId, "ascendancy");
      subregionByNodeId.set(nodeId, subregion);
    }
  }

  return {
    subregionByNodeId,
    regionByNodeId,
  };
}

export function discoverAscendancyNodes(
  startNode: PassiveNode,
  adj: PassiveTreeAdjacency,
  nodes: PassiveGraph["nodesById"],
): Set<NodeId> {
  const visited = new Set<NodeId>();

  const DFSRecursive = (node: PassiveNode) => {
    visited.add(node.id);

    const neighbors = getNeighborIds(node.id, adj);

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const neighborNode = nodes.get(neighbor);
        if (!neighborNode) continue;
        if (!isAscendancyTraversalNode(neighborNode)) continue;
        DFSRecursive(neighborNode);
      }
    }
  };

  DFSRecursive(startNode);
  return visited;
}
