import type {
  AllocationNodeState,
  AllocationState,
} from "@/domain/build/models/allocation/Allocation";
import type { BuildState } from "@/domain/build/models/BuildState";
import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import type { NodeId } from "@/domain/graph/PassiveNode";
import { computeEdgeKeysFromNodeIds } from "@/domain/graph/queries/computeEdgeKeysFromNodeIds";
import { getActiveRootNodeIds } from "@/domain/graph/queries/getActiveRootNodeIds";
import { applyAllocationFlagsToNodeState } from "./analysis/applyAllocationFlagsToNodeState";
import { applyWeightedPathsToNodeState } from "./analysis/applyWeightedPathsToNodeState";
import { applyConnectivityToNodeState } from "./analysis/applyConnectivityToNodeState";
import { mergeDependenciesIntoNodeState } from "./analysis/mergeDependenciesIntoNodeState";
import { computeWeightedPaths } from "@/domain/build/algorithms/pathfinding";
import { computeDependencies, computeConnectivity } from "@/domain/build/algorithms/dependencies";

export interface ComputeAllocationStateParams {
  graph: PassiveGraph;
  buildState: BuildState;
}

export function computeAllocationState({
  graph,
  buildState,
}: ComputeAllocationStateParams): AllocationState {
  const allocatedNodeIds = new Set(buildState.allocatedNodeIds);

  const rootNodeIds = new Set(
    getActiveRootNodeIds(graph, buildState.activeClassId, buildState.activeAscendancy),
  );

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
    build: buildState,
    nodeStateById,
  });

  const pathByNodeId = new Map<NodeId, NodeId[]>();
  for (const [nodeId, nodeState] of nodeStateById) {
    pathByNodeId.set(nodeId, nodeState.path ?? []);
  }

  const dependencies = computeDependencies({
    allocatedNodeIds,
    pathByNodeId,
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

  const activeEdgeKeys = computeEdgeKeysFromNodeIds(graph, allocatedNodeIds);

  return {
    activeClassId: buildState.activeClassId,
    rootNodeIds: new Set(rootNodeIds),
    allocatedNodeIds,
    nodeStateById,
    allocatableNodeIds,
    activeEdgeKeys,
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
