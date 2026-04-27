import type { AllocationSnapshot } from "@/domain/build/allocation/Allocation";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import { makeEdgeKey } from "../mappers/mapEdgeToRenderModel";
import type { TreeVisualStateModel } from "../models/Render";

export interface CreateTreeVisualStateParams {
  snapshot: AllocationSnapshot | null;
  hoveredNodeId: NodeId | null;
}

export function createTreeVisualState({
  snapshot,
  hoveredNodeId,
}: CreateTreeVisualStateParams): TreeVisualStateModel {
  const allocatedNodeIds = new Set<NodeId>();
  const allocatableNodeIds = new Set<NodeId>();
  const connectedNodeIds = new Set<NodeId>();
  const previewNodeIds = new Set<NodeId>();
  const previewEdgeKeys = new Set<string>();
  let activeStartNodeIds = new Set<NodeId>();

  if (snapshot) {
    activeStartNodeIds = snapshot.rootNodeIds;
    for (const [nodeId, state] of snapshot.nodeStateById) {
      if (state.allocated) allocatedNodeIds.add(nodeId);
      if (state.allocatable) allocatableNodeIds.add(nodeId);
      if (state.connectedToStart) connectedNodeIds.add(nodeId);
    }

    if (hoveredNodeId) {
      const hoveredState = snapshot.nodeStateById.get(hoveredNodeId);
      const path = hoveredState?.path ?? [];

      for (const nodeId of path) {
        previewNodeIds.add(nodeId);
      }

      for (let i = 1; i < path.length; i += 1) {
        previewEdgeKeys.add(makeEdgeKey(path[i - 1]!, path[i]!));
      }
    }
  }

  return {
    activeStartNodeIds,
    allocatedNodeIds,
    previw: {
      edgeKeys: previewEdgeKeys,
      nodeIds: previewNodeIds,
    },
    // allocatableNodeIds,
    hoveredNodeId,
  };
}
