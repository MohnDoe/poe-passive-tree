import type { EdgeKey } from "../GraphEdge";
import type { PassiveGraph } from "../PassiveGraph";
import type { NodeId } from "../PassiveNode";

export function computeEdgeKeysFromNodeIds(
  graph: PassiveGraph,
  nodeIds: ReadonlySet<NodeId>,
): Set<EdgeKey> {
  const edgeKeys = new Set<EdgeKey>();

  for (const edge of graph.edges) {
    const nodeA = nodeIds.has(edge.source);
    if (!nodeA) continue;
    const nodeB = nodeIds.has(edge.target);
    if (!nodeB) continue;

    edgeKeys.add(edge.key);
  }

  return edgeKeys;
}
