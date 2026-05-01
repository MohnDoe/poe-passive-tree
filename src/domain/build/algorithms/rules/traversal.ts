import type { PassiveGraph, PassiveTreeAdjacency } from "@/domain/graph/PassiveGraph";
import type { NodeId, PassiveNode } from "@/domain/graph/PassiveNode";

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

export function canTraverse(graph: PassiveGraph, from: PassiveNode, to: PassiveNode): boolean {
  if (from.kind === "mastery") return false;
  if (to.kind === "classStart" || to.kind === "ascendancyStart") return false;

  const fromRegion = graph.regionByNodeId.get(from.id);
  const toRegion = graph.regionByNodeId.get(to.id);

  if (!fromRegion || !toRegion) return false;
  if (fromRegion !== toRegion) return false;

  if (fromRegion === "ascendancy") {
    const fromSubregion = graph.subregionByNodeId.get(from.id);
    const toSubregion = graph.subregionByNodeId.get(to.id);

    return fromSubregion !== null && fromSubregion === toSubregion;
  }

  return true;
}
