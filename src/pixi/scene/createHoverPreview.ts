import type { EdgeKey } from "@/domain/graph/GraphEdge";
import type { NodeId } from "@/domain/graph/PassiveNode";
import type { HoverPreviewStateModel } from "../models/Render";
import { analyzeRefundTarget } from "@/domain/build/algorithms/refund";
import { makeEdgeKeysFromPath } from "@/domain/graph/edgeKeys";
import type { AllocationState } from "@/domain/build/models/allocation/Allocation";

export interface createHoverPreviewStateModelParams {
  allocationState: AllocationState | null;
  hoveredNodeId: NodeId | null;
}

const defaultStates = {
  nodeIds: new Set<NodeId>(),
  edgeKeys: new Set<EdgeKey>(),
};

export function createHoverPreviewStateModel({
  allocationState,
  hoveredNodeId,
}: createHoverPreviewStateModelParams): HoverPreviewStateModel {
  const previewState: HoverPreviewStateModel = {
    hoveredNodeId,
    highlight: defaultStates,
    refund: defaultStates,
  };

  if (!allocationState || !hoveredNodeId) {
    return previewState;
  }

  const hoveredNodeState = allocationState.nodeStateById.get(hoveredNodeId);
  if (!hoveredNodeState) return previewState;

  if (!hoveredNodeState.reachable && !hoveredNodeState.allocated) {
    return previewState;
  }

  const highlightedPath = hoveredNodeState.path ?? [];

  const refundAnalysis = analyzeRefundTarget(hoveredNodeId, allocationState.nodeStateById);

  return {
    hoveredNodeId,
    highlight: {
      nodeIds: new Set(highlightedPath),
      edgeKeys: makeEdgeKeysFromPath({ path: highlightedPath }),
    },
    refund: {
      nodeIds: refundAnalysis.refundedNodeIds,
      edgeKeys: refundAnalysis.refundedEdgeKeys,
    },
  };
}
