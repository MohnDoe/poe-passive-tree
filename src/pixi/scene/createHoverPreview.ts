import type { AllocationSnapshot } from "@/domain/build/allocation/Allocation";
import type { EdgeKey } from "@/domain/passiveGraph/GraphEdge";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import type { HoverPreviewStateModel } from "../models/Render";
import { makeEdgeKeysFromPath } from "./createTreeVisualStateModel";
import {
  computeRefundClosure,
  computeRefundPath,
} from "@/services/passiveTree/allocation/analysis/refund";

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
  const highlightedPath = hoveredNodeState?.path ?? [];

  const refundedNodeIds = computeRefundClosure(hoveredNodeId, snapshot.nodeStateById);
  const refundedEdgeKeys = computeRefundPath(refundedNodeIds, snapshot.nodeStateById);

  return {
    hoveredNodeId,
    highlight: {
      nodeIds: new Set(highlightedPath),
      edgeKeys: makeEdgeKeysFromPath(highlightedPath),
    },
    refund: {
      nodeIds: refundedNodeIds,
      edgeKeys: refundedEdgeKeys,
    },
  };
}
