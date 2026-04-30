import type {
  AllocationNodeState,
  AllocationSnapshot,
} from "@/domain/build/models/allocation/Allocation";
import type { BuildState } from "@/domain/build/models/BuildState";
import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import { applyAllocationFlagsToNodeState } from "./analysis/applyAllocationFlagsToNodeState";
import { applyWeightedPathsToNodeState } from "./analysis/applyWeightedPathsToNodeState";
import { applyConnectivityToNodeState, computeConnectivity } from "./analysis/computeConnectivity";
import { computeDependencies } from "./analysis/computeDependencies";
import { mergeDependenciesIntoNodeState } from "./analysis/mergeDependenciesIntoNodeState";
import { computeWeightedPaths } from "./pathfinding/computeWeightedPaths";
import { getActiveRootNodeIds } from "../queries/getActiveRootNodeIds";

export interface BuildAllocationSnapshotParams {
  graph: PassiveGraph;
  buildState: BuildState;
}

export function buildAllocationSnapshot({
  graph,
  buildState,
}: BuildAllocationSnapshotParams): AllocationSnapshot {
  const allocatedNodeIds = new Set(buildState.allocatedNodeIds);

  const rootNodeIds = new Set(getActiveRootNodeIds(graph, buildState));

  const nodeStateById = createDefaultNodeState(graph.nodesById, allocatedNodeIds);

  const weightedPaths = computeWeightedPaths({
    graph,
    rootNodeIds,
    allocatedNodeIds,
  });

  applyWeightedPathsToNodeState({
    nodeStateById,
    weightedPaths,
  });

  applyAllocationFlagsToNodeState({
    graph,
    nodeStateById,
  });

  const dependencies = computeDependencies({
    allocatedNodeIds,
    nodeStateById,
  });

  mergeDependenciesIntoNodeState({
    nodeStateById,
    dependencies,
  });

  const allocatableNodeIds: Set<NodeId> = new Set(
    [...nodeStateById]
      .filter(([_, nodeState]) => nodeState.allocatable)
      .map(([nodeId]) => {
        return nodeId;
      }),
  );

  const connectedNodeIds = computeConnectivity({
    allocatedNodeIds,
    graph,
    rootNodeIds,
  });

  applyConnectivityToNodeState(nodeStateById, connectedNodeIds);

  return {
    activeClassId: buildState.activeClassId,
    rootNodeIds: new Set(rootNodeIds),
    allocatedNodeIds,
    nodeStateById,
    allocatableNodeIds,
    // connectedNodeIds,
  };
}

function createDefaultNodeState(
  nodesById: PassiveGraph["nodesById"],
  allocatedNodeIds: Set<NodeId>,
): Map<NodeId, AllocationNodeState> {
  const out = new Map<NodeId, AllocationNodeState>();

  for (const [nodeId] of nodesById) {
    out.set(nodeId, {
      id: nodeId,
      connectedToStart: false,
      allocatable: false,
      reachable: false,
      allocated: allocatedNodeIds.has(nodeId),
      path: null,
      pathCost: null,
      dependsOn: new Set<NodeId>(),
      requiredBy: new Set<NodeId>(),
    });
  }

  return out;
}
