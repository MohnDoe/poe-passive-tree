import type { NormalizedNodes } from "@/data/mapping/nodes.mapper";
import type { PassiveNodeNormalized, NodeId } from "../models/passiveNode";
import type { PassiveTreeAdjacency } from "../models/passiveTree";
import type { GraphEdge } from "./edges";

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

export function buildTraversalAdjacency(
  nodes: NormalizedNodes,
  edges: GraphEdge[],
  activeAscendancy?: string,
): PassiveTreeAdjacency {
  const adj = new Map();

  const connect = (a: NodeId, b: NodeId) => {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  };

  for (const edge of edges) {
    const sourceNode = nodes.get(edge.source);
    const targetNode = nodes.get(edge.target);

    if (!sourceNode || !targetNode) continue;

    // RULE: Cannot path through proxy nodes
    if (edge.isProxyTransition) continue;

    // RULE: Masteries are endpoints. We can allocate them, but we cannot path *through* them.
    // Usually, pathfinding ignores them, and allocating a mastery is just a check if the parent notable is allocated.
    if (edge.isMasteryLink) continue;

    // RULE: Ascendancy gating
    if (sourceNode.ascendancyName && sourceNode.ascendancyName !== activeAscendancy) continue;
    if (targetNode.ascendancyName && targetNode.ascendancyName !== activeAscendancy) continue;

    connect(edge.source, edge.target);
  }

  return adj;
}
