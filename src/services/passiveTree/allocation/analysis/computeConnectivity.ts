import type { AllocationNodeState } from "@/domain/build/allocation/Allocation";
import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

export interface ComputeConnectivityParams {
  graph: PassiveGraph;
  rootNodeIds: ReadonlySet<NodeId>;
  allocatedNodeIds: ReadonlySet<NodeId>;
}

export function computeConnectivity({
  graph,
  rootNodeIds,
  allocatedNodeIds,
}: ComputeConnectivityParams): Set<NodeId> {
  const connectedNodeIds = new Set<NodeId>();
  const queue: NodeId[] = [...rootNodeIds];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (connectedNodeIds.has(nodeId)) continue;

    const node = graph.nodesById.get(nodeId);
    if (!node) continue;

    if (!allocatedNodeIds.has(nodeId) && !rootNodeIds.has(nodeId)) continue;

    connectedNodeIds.add(nodeId);

    for (const neighborId of graph.adjacency.get(nodeId) ?? []) {
      const neighbor = graph.nodesById.get(neighborId);
      if (!neighbor) continue;
      if (!allocatedNodeIds.has(neighborId)) continue;
      if (neighbor.kind === "mastery") continue;
      if (neighbor.kind === "classStart" || neighbor.kind === "ascendancyStart") continue;

      queue.push(neighborId);
    }
  }

  return connectedNodeIds;
}

export function applyConnectivityToNodeState(
  nodeStateById: Map<NodeId, AllocationNodeState>,
  connectedNodeIds: ReadonlySet<NodeId>,
): void {
  for (const [nodeId, state] of nodeStateById) {
    state.connectedToStart = connectedNodeIds.has(nodeId);
  }
}
