import type { AllocationSnapshot } from "@/domain/build/allocation/Allocation";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import type { TreeVisualStateModel } from "../models/Render";
import type { EdgeKey } from "@/domain/passiveGraph/GraphEdge";
import { makeEdgeKey } from "@/services/passiveTree/runtime/graph/buildEdges";

export interface CreateTreeVisualStateParams {
  snapshot: AllocationSnapshot | null;
  // hoveredNodeId: NodeId | null;
}

export function createTreeVisualState({
  snapshot,
  // hoveredNodeId,
}: CreateTreeVisualStateParams): TreeVisualStateModel {
  const allocatedNodeIds = new Set<NodeId>();
  let allocatedPathEdgeKeys = new Set<EdgeKey>();

  const allocatableNodeIds = new Set<NodeId>();

  //TODO: use it maybe later (hide non-connected or smth)

  // const connectedNodeIds = new Set<NodeId>();

  // const previewNodeIds = new Set<NodeId>();
  // let previewEdgeKeys = new Set<EdgeKey>();

  let activeStartNodeIds = new Set<NodeId>();

  if (snapshot) {
    activeStartNodeIds = snapshot.rootNodeIds;
    for (const [nodeId, state] of snapshot.nodeStateById) {
      if (state.allocated) {
        allocatedNodeIds.add(nodeId);
        allocatedPathEdgeKeys = new Set([
          ...allocatedPathEdgeKeys,
          ...makeEdgeKeysFromPath(state.path ?? []),
        ]);
      }
      if (state.allocatable) allocatableNodeIds.add(nodeId);
      // if (state.connectedToStart) connectedNodeIds.add(nodeId);
    }
  }

  return {
    activeStartNodeIds,
    allocated: {
      nodeIds: allocatedNodeIds,
      edgeKeys: allocatedPathEdgeKeys,
    },
    allocatableNodeIds,
  };
}

//TODO: move this
export function makeEdgeKeysFromPath(path: NodeId[]): Set<EdgeKey> {
  const edgeKeys = new Set<EdgeKey>();
  for (let i = 1; i < path.length; i += 1) {
    edgeKeys.add(makeEdgeKey(path[i - 1]!, path[i]!));
  }

  return edgeKeys;
}
