import type { EdgeKey } from "@/domain/passiveGraph/GraphEdge";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import type { HoverPreviewStateModel } from "../models/Render";
import { analyzeRefundTarget } from "@/services/passiveTree/allocation/analysis/refund";
import { makeEdgeKeysFromPath } from "@/domain/passiveGraph/edgeKeys";
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
