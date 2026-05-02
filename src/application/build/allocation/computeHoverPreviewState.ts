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
  let previewState: HoverPreviewState = {
    hoveredNodeId,
    highlight: defaultStates,
    refund: defaultStates,
  };

  if (!allocationState || !hoveredNodeId) {
    return previewState;
  }

  const hoveredNodeState = allocationState.nodeStateById.get(hoveredNodeId);
  if (!hoveredNodeState) return previewState;

  console.log("hovered node state", hoveredNodeState);

  if (!hoveredNodeState.reachable && !hoveredNodeState.allocated) {
    return previewState;
  }

  if (hoveredNodeState.allocated) {
    const refundAnalysis = analyzeRefundTarget(hoveredNodeId, allocationState.nodeStateById);
    previewState = {
      ...previewState,
      refund: {
        nodeIds: refundAnalysis.refundedNodeIds,
        edgeKeys: refundAnalysis.refundedEdgeKeys,
      },
    };
  } else {
    const fullPath = hoveredNodeState.path ?? [];
    const highlightedNodeIds = new Set<NodeId>(
      fullPath.filter((id) => !allocationState.allocatableNodeIds.has(id)),
    );

    highlightedNodeIds.add(hoveredNodeId);

    previewState = {
      ...previewState,
      highlight: {
        nodeIds: highlightedNodeIds,
        edgeKeys: makeEdgeKeysFromPath({ path: fullPath }),
      },
    };
  }

  console.log("previewState", previewState);

  return previewState;
}
