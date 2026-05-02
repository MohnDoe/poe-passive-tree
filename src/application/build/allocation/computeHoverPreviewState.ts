import { analyzeRefundTarget } from "@/domain/build/algorithms/refund";
import type { AllocationState } from "@/domain/build/models/allocation/Allocation";
import type { HoverPreviewState } from "@/domain/build/models/allocation/HoverPreviewState";
import { makeEdgeKeysFromPath } from "@/domain/graph/edgeKeys";
import type { EdgeKey } from "@/domain/graph/GraphEdge";
import type { NodeId } from "@/domain/graph/PassiveNode";

export interface ComputeHoverPreviewStateParams {
  allocationState: AllocationState | null;
  hoveredNodeId: NodeId | null;
}

const defaultStates = {
  nodeIds: new Set<NodeId>(),
  edgeKeys: new Set<EdgeKey>(),
};

export function computeHoverPreviewState({
  allocationState,
  hoveredNodeId,
}: ComputeHoverPreviewStateParams): HoverPreviewState {
  const previewState: HoverPreviewState = {
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
