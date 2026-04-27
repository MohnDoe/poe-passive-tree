import type { PassiveGraph, PassiveTreeAdjacency } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeId, PassiveNode } from "@/domain/passiveGraph/PassiveNode";

function isAscendancyTraversalNode(node: PassiveNode) {
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

export function getNeighborIds(nodeId: NodeId, adj: PassiveTreeAdjacency): Set<NodeId> {
  return adj.get(nodeId) || new Set();
}

export function canTraverse(from: PassiveNode, to: PassiveNode, currentDistance: number): boolean {
  if (from.kind === "mastery") return false;
  if (to.kind === "classStart" || to.kind === "ascendancyStart") return false;

  const sameAscendancy = from.ascendancyName === to.ascendancyName;
  const mayLeaveAscendancyAtRoot = currentDistance === 0 && !to.ascendancyName;

  return sameAscendancy || mayLeaveAscendancyAtRoot;
}
