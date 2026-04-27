import type { AllocationNodeState } from "@/domain/build/allocation/Allocation";
import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

export interface ComputeConnectivityParams {
  graph: PassiveGraph;
  rootNodeIds: ReadonlySet<NodeId>;
  allocatedNodeIds: ReadonlySet<NodeId>;
  nodeStateById: Map<NodeId, AllocationNodeState>;
}

export function computeConnectivity({
  graph,
  nodeStateById,
  rootNodeIds,
  allocatedNodeIds,
}: ComputeConnectivityParams): Set<NodeId> {
  const connectedNodeIds = new Set<NodeId>();

  if (!graph) return connectedNodeIds;

  const queue: NodeId[] = [...rootNodeIds];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (connectedNodeIds.has(nodeId)) continue;

    const node = graph.nodesById.get(nodeId);
    if (!node) continue;

    if (!allocatedNodeIds.has(nodeId) && !rootNodeIds.has(nodeId)) continue;

    connectedNodeIds.add(nodeId);
    nodeStateById.get(nodeId)!.connectedToStart = true;

    for (const neighborId of graph.adjacency.get(nodeId) ?? []) {
      const neighbor = graph.nodesById.get(neighborId);
      if (!neighbor) continue;
      if (!allocatedNodeIds.has(neighborId)) continue;
      if (node.kind === "mastery") continue;
      if (neighbor.kind === "classStart" || neighbor.kind === "ascendancyStart") continue;

      queue.push(neighborId);
    }
  }

  return connectedNodeIds;
}
