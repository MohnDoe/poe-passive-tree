import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import type { TreeVisualStateModel } from "../models/Render";
import type { EdgeKey } from "@/domain/passiveGraph/GraphEdge";
import { makeEdgeKeysFromPath } from "@/domain/passiveGraph/edgeKeys";
import type { AllocationSnapshot } from "@/domain/build/models/allocation/Allocation";

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
          ...makeEdgeKeysFromPath({ path: state.path ?? [] }),
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
