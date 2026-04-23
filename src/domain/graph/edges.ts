import type { NormalizedNodes } from "@/data/mapping/nodes.mapper";
import type { NodeId, PassiveNodeNormalized } from "../models/passiveNode";

export interface GraphEdge {
  source: NodeId;
  target: NodeId;
  isAscendancyTransition: boolean;
  isMasteryLink: boolean;
  isProxyTransition: boolean;
}

export function extractEdges(nodes: NormalizedNodes): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const seenEdges = new Set<string>(); // To prevent A->B and B->A duplication

  const addEdge = (sourceId: NodeId, targetId: NodeId) => {
    if (!nodes.has(sourceId) || !nodes.has(targetId)) return;

    const min = Math.min(parseInt(sourceId), parseInt(targetId));
    const max = Math.max(parseInt(sourceId), parseInt(targetId));
    const edgeKey = `${min}-${max}`;

    if (seenEdges.has(edgeKey)) return;
    seenEdges.add(edgeKey);

    const sourceNode = nodes.get(sourceId)!;
    const targetNode = nodes.get(targetId)!;

    edges.push({
      source: sourceId,
      target: targetId,
      isAscendancyTransition: isAscendancyTransition(sourceNode, targetNode),
      isMasteryLink: sourceNode.kind === "mastery" || targetNode.kind === "mastery",
      isProxyTransition: isProxyTransition(sourceNode, targetNode),
    });
  };

  for (const node of nodes.values()) {
    for (const outId of node.out ?? []) addEdge(node.id, outId);
    for (const inId of node.in ?? []) addEdge(node.id, inId);
  }

  return edges;
}

export function isAscendancyTransition(
  sourceNode: PassiveNodeNormalized,
  targetNode: PassiveNodeNormalized,
): boolean {
  return (
    (!!sourceNode.ascendancyName && !targetNode.ascendancyName) ||
    (!sourceNode.ascendancyName && !!targetNode.ascendancyName)
  );
}

export function isProxyTransition(
  sourceNode: PassiveNodeNormalized,
  targetNode: PassiveNodeNormalized,
): boolean {
  //FIX: this is wrong
  return sourceNode.kind === "proxy" || targetNode.kind === "proxy";
}

export function getRenderableEdges(edges: GraphEdge[]): GraphEdge[] {
  return edges.filter((edge) => {
    // RULE: Proxies are invisible structural anchors (used for jewel socket radii usually). Do not draw lines to them.
    if (edge.isProxyTransition) return false;

    // RULE: Mastery nodes sit in the center of an orbit but do not have visual lines connecting them to the notables.
    if (edge.isMasteryLink) return false;

    // RULE: Ascendancy start nodes act as teleport points from the main tree. Don't draw a massive line across the screen.
    if (edge.isAscendancyTransition) return false;

    return true;
  });
}
