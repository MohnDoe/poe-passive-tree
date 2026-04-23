import type { NormalizedNodes } from "@/data/mapping/nodes.mapper";
import type { PassiveNodeNormalized, NodeId } from "../models/passiveNode";
import type { PassiveTreeAdjacency } from "../models/passiveTree";

function isAscendancyTraversalNode(node: PassiveNodeNormalized) {
  if (node.kind === "jewel") return false;
  return (
    node.kind === "ascendancyStart" ||
    !!node.ascendancyName ||
    node.isMultipleChoice ||
    node.isMultipleChoiceOption ||
    node.kind == "proxy"
  );
}

export function traverseAscendancyRegion(
  startNode: PassiveNodeNormalized,
  adj: PassiveTreeAdjacency,
  nodes: NormalizedNodes,
): Set<NodeId> {
  const visited = new Set<NodeId>();

  const DFSRecursive = (node: PassiveNodeNormalized) => {
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

export function getNeighborIds(nodeId: NodeId, adj: PassiveTreeAdjacency): Set<NodeId> {
  return adj.get(nodeId) || new Set();
}
