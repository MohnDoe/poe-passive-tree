import type { NormalizedNodes } from "@/data/mapping/nodes";
import type { PassiveNodeNormalized, NodeId } from "../models/passiveNode";
import type { PassiveTreeAdjacency } from "../models/passiveTree";


function isAscendancyTraversalNode(node: PassiveNodeNormalized) {
  if (node.type === 'jewel') return false;
  return (node.isAscendancyStart ||
    !!node.ascendancyName ||
    node.isMultipleChoice ||
    node.isMultipleChoiceOption ||
    node.isProxy
  )
}


export function traverseAscendancyRegion(startNode: PassiveNodeNormalized, adj: PassiveTreeAdjacency, nodes: NormalizedNodes): Set<NodeId> {
  const visited = new Set<NodeId>();

  const DFSRecursive = (node: PassiveNodeNormalized) => {
    visited.add(node.id);

    const neighbors = adj.get(node.id) || [];


    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const neighborNode = nodes.get(neighbor);
        if (!neighborNode) continue;
        if (!isAscendancyTraversalNode(neighborNode)) continue;
        DFSRecursive(neighborNode);
      }
    }
  }

  DFSRecursive(startNode);
  return visited;
}
