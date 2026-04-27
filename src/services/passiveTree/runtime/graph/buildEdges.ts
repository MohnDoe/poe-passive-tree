import type { MappedPassiveTree } from "@/data/mapping/MappedPassiveTree";
import type { GraphEdge } from "@/domain/passiveGraph/GraphEdge";
import type { NodeId, PassiveNode } from "@/domain/passiveGraph/PassiveNode";

export function buildEdges(nodes: MappedPassiveTree["nodesById"]): GraphEdge[] {
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
      key: edgeKey,
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

function isAscendancyTransition(sourceNode: PassiveNode, targetNode: PassiveNode): boolean {
  return (
    (!!sourceNode.ascendancyName && !targetNode.ascendancyName) ||
    (!sourceNode.ascendancyName && !!targetNode.ascendancyName)
  );
}

function isProxyTransition(sourceNode: PassiveNode, targetNode: PassiveNode): boolean {
  //FIX: this is wrong
  return sourceNode.kind === "proxy" || targetNode.kind === "proxy";
}
