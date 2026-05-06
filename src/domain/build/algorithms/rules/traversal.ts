import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import type { PassiveNode } from "@/domain/graph/PassiveNode";

export function isAscendancyTraversalNode(node: PassiveNode) {
  if (node.kind === "jewel") return false;
  return (
    node.kind === "ascendancyStart" ||
    !!node.ascendancyName ||
    node.isMultipleChoice ||
    node.isMultipleChoiceOption ||
    node.kind == "proxy"
  );
}

export function canExpandTo(graph: PassiveGraph, from: PassiveNode, to: PassiveNode): boolean {
  if (from.id === to.id) return false;
  return isTraversableEdge(graph, from, to);
}

export function isTraversableEdge(
  graph: PassiveGraph,
  from: PassiveNode,
  to: PassiveNode,
): boolean {
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
