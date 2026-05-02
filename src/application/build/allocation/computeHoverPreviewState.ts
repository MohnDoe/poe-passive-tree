import { analyzeRefundTarget } from "@/domain/build/algorithms/refund";
import type { AllocationState } from "@/domain/build/models/allocation/Allocation";
import type { HoverPreviewState } from "@/domain/build/models/allocation/HoverPreviewState";
import { makeEdgeKeysFromPath } from "@/domain/graph/edgeKeys";
import type { EdgeKey } from "@/domain/graph/GraphEdge";
import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import type { NodeId } from "@/domain/graph/PassiveNode";

export interface ComputeHoverPreviewStateParams {
  allocationState: AllocationState | null;
  hoveredNodeId: NodeId | null;
  graph: PassiveGraph | null;
}

const defaultStates = {
  nodeIds: new Set<NodeId>(),
  edgeKeys: new Set<EdgeKey>(),
};

export function computeHoverPreviewState({
  allocationState,
  hoveredNodeId,
  graph,
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

  if (hoveredNodeState.allocated && graph) {
    const refundAnalysis = analyzeRefundTarget(hoveredNodeId, allocationState.nodeStateById, graph);
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
      fullPath.filter((id) => !allocationState.allocatedNodeIds.has(id)),
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
