import type { MappedPassiveTree } from "@/infrastructure/mapping/MappedPassiveTree";
import type { PassiveTreeAdjacency } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

export function buildAdjacency(nodes: MappedPassiveTree["nodesById"]): PassiveTreeAdjacency {
  const adj = new Map<NodeId, Set<NodeId>>();

  const connect = (a: NodeId, b: NodeId) => {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());

    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  };

  for (const [nodeId, node] of nodes) {
    for (const targetId of node.out) connect(nodeId, targetId);
    for (const sourceId of node.in) connect(nodeId, sourceId);
  }

  return adj;
}
