import type { MappedPassiveTree } from "@/infrastructure/passiveTree/mapping/MappedPassiveTree";
import { makeEdgeKey } from "@/domain/graph/edgeKeys";
import type { GraphEdge } from "@/domain/graph/GraphEdge";
import type { NodeId, PassiveNode } from "@/domain/graph/PassiveNode";

export function buildEdges(nodes: MappedPassiveTree["nodesById"]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const seenEdges = new Set<string>(); // To prevent A->B and B->A duplication

  const addEdge = (sourceId: NodeId, targetId: NodeId) => {
    if (!nodes.has(sourceId) || !nodes.has(targetId)) return;

    const edgeKey = makeEdgeKey(sourceId, targetId);

    if (seenEdges.has(edgeKey)) return;
    seenEdges.add(edgeKey);

    const sourceNode = nodes.get(sourceId)!;
    const targetNode = nodes.get(targetId)!;

    edges.push({
      key: edgeKey,
      source: sourceId,
      target: targetId,
      isAscendancyTransition: isAscendancyTransition(sourceNode, targetNode),
      isMasteryLink: isMasteryLink(sourceNode, targetNode),
      isProxyTransition: isProxyTransition(sourceNode, targetNode),
    });
  };

  for (const node of nodes.values()) {
    for (const outId of node.out ?? []) addEdge(node.id, outId);
    for (const inId of node.in ?? []) addEdge(node.id, inId);
  }

  return edges;
}

function isMasteryLink(sourceNode: PassiveNode, targetNode: PassiveNode): boolean {
  return sourceNode.kind === "mastery" || targetNode.kind === "mastery";
}

function isAscendancyTransition(sourceNode: PassiveNode, targetNode: PassiveNode): boolean {
  const sourceHasAscendancy = hasAscendancyName(sourceNode);
  const targetHasAscendancy = hasAscendancyName(targetNode);
  return (sourceHasAscendancy && !targetHasAscendancy) ||
    (!sourceHasAscendancy && targetHasAscendancy);
}

/** Nodes in the union that carry an optional `ascendancyName` property. */
type PassiveNodeWithAscendancyName = Extract<PassiveNode, { ascendancyName?: unknown }>;

function hasAscendancyName(node: PassiveNode): node is PassiveNodeWithAscendancyName {
  return "ascendancyName" in node && !!node.ascendancyName;
}

function isProxyTransition(sourceNode: PassiveNode, targetNode: PassiveNode): boolean {
  //FIX: this is wrong
  return sourceNode.kind === "proxy" || targetNode.kind === "proxy";
}
