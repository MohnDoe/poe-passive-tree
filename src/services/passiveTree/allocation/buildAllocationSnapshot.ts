import type { AllocationNodeState, AllocationSnapshot } from "@/domain/build/allocation/Allocation";
import type { BuildState } from "@/domain/build/BuildState";
import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import { computeWeightedPaths } from "./pathfinding/computeWeightedPaths";
import { mergeWeightedPathsIntoNodeState } from "./analysis/mergeWeightedPathsIntoNodeState";
import { computeConnectivity } from "./analysis/computeConnectivity";
import { getClassStartNodeIds } from "../queries/getClassStartNodeIds";
import { computeDependencies } from "./analysis/computeDependencies";
import { mergeDependenciesIntoNodeState } from "./analysis/mergeDependenciesIntoNodeState";

export interface BuildAllocationSnapshotParams {
  graph: PassiveGraph;
  buildState: BuildState;
}

export function buildAllocationSnapshot({
  graph,
  buildState,
}: BuildAllocationSnapshotParams): AllocationSnapshot {
  const allocatedNodeIds = new Set(buildState.allocatedNodeIds);

  const rootNodeIds = new Set(getClassStartNodeIds(graph, buildState.activeClassId));

  const nodeStateById = createDefaultNodeState(graph.nodesById, allocatedNodeIds);

  const weightedPaths = computeWeightedPaths({
    graph,
    rootNodeIds,
    allocatedNodeIds,
  });

  mergeWeightedPathsIntoNodeState({
    nodeStateById,
    weightedPaths,
  });

  const dependencies = computeDependencies({
    allocatedNodeIds,
    nodeStateById,
  });

  mergeDependenciesIntoNodeState({
    nodeStateById,
    dependencies,
  });

  const connectedNodeIds = computeConnectivity({
    allocatedNodeIds,
    graph,
    nodeStateById,
    rootNodeIds,
  });

  const reachableNodeIds = new Set<NodeId>();
  const allocatableNodeIds = new Set<NodeId>();

  for (const [nodeId, state] of nodeStateById) {
    if (state.path !== null) {
      reachableNodeIds.add(nodeId);
    }

    if (!state.allocated && state.path !== null) {
      state.allocatable = true;
      allocatableNodeIds.add(nodeId);
    }
  }

  return {
    activeClassId: buildState.activeClassId,
    rootNodeIds: new Set(rootNodeIds),
    allocatedNodeIds,
    nodeStateById,
    allocatableNodeIds,
    connectedNodeIds,
    reachableNodeIds,
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
      allocated: allocatedNodeIds.has(nodeId),
      path: null,
      pathCost: null,
      dependsOn: new Set<NodeId>(),
      requiredBy: new Set<NodeId>(),
    });
  }

  return out;
}
