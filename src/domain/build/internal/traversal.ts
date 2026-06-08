import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import { PassiveNode } from "@/domain/graph/PassiveNode";

export function isAscendancyTraversalNode(node: PassiveNode): boolean {
  if (PassiveNode.isJewelSocket(node)) return false;
  if (PassiveNode.isAscendancyStart(node)) return true;
  if (PassiveNode.isProxy(node)) return true;
  // ascendancyName is on: notable, normal, jewel, ascendancyStart
  if ("ascendancyName" in node && node.ascendancyName) return true;
  if ("isMultipleChoice" in node && node.isMultipleChoice) return true;
  if ("isMultipleChoiceOption" in node && node.isMultipleChoiceOption) return true;
  return false;
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
  if (PassiveNode.isMastery(from)) return false;
  if (PassiveNode.isClassStart(to) || PassiveNode.isAscendancyStart(to)) return false;

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
