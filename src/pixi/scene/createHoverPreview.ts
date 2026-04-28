import type { AllocationSnapshot } from "@/domain/build/allocation/Allocation";
import type { EdgeKey } from "@/domain/passiveGraph/GraphEdge";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import type { HoverPreviewStateModel } from "../models/Render";
import { analyzeRefundTarget } from "@/services/passiveTree/allocation/analysis/refund";
import { makeEdgeKeysFromPath } from "@/domain/passiveGraph/edgeKeys";

export interface createHoverPreviewStateModelParams {
  snapshot: AllocationSnapshot | null;
  hoveredNodeId: NodeId | null;
}

const defaultStates = {
  nodeIds: new Set<NodeId>(),
  edgeKeys: new Set<EdgeKey>(),
};

export function createHoverPreviewStateModel({
  snapshot,
  hoveredNodeId,
}: createHoverPreviewStateModelParams): HoverPreviewStateModel {
  const previewState: HoverPreviewStateModel = {
    hoveredNodeId,
    highlight: defaultStates,
    refund: defaultStates,
  };

  if (!snapshot || !hoveredNodeId) {
    return previewState;
  }

  const hoveredNodeState = snapshot.nodeStateById.get(hoveredNodeId);
  if (!hoveredNodeState) return previewState;

  const highlightedPath = hoveredNodeState.path ?? [];

  const refundAnalysis = analyzeRefundTarget(hoveredNodeId, snapshot.nodeStateById);

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
