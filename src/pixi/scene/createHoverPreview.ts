import type { AllocationSnapshot } from "@/domain/build/allocation/Allocation";
import type { EdgeKey } from "@/domain/passiveGraph/GraphEdge";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import type { HoverPreviewStateModel } from "../models/Render";
import { makeEdgeKeysFromPath } from "./createTreeVisualStateModel";

export interface createHoverPreviewStateModelParams {
  snapshot: AllocationSnapshot | null;
  hoveredNodeId: NodeId | null;
}

export function createHoverPreviewStateModel({
  snapshot,
  hoveredNodeId,
}: createHoverPreviewStateModelParams): HoverPreviewStateModel {
  let nodeIds = new Set<NodeId>();
  let edgeKeys = new Set<EdgeKey>();

  if (!snapshot || !hoveredNodeId) {
    return { hoveredNodeId, nodeIds, edgeKeys };
  }

  const hoveredNodeState = snapshot.nodeStateById.get(hoveredNodeId);
  const path = hoveredNodeState?.path ?? [];

  nodeIds = new Set(path);
  edgeKeys = makeEdgeKeysFromPath(path);

  return { hoveredNodeId, nodeIds, edgeKeys };
}
