import type { AllocationSnapshot } from "@/domain/build/allocation/Allocation";
import type { EdgeKey } from "@/domain/passiveGraph/GraphEdge";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import { makeEdgeKey } from "../mappers/mapEdgeToRenderModel";
import type { HoverPreviewStateModel } from "../models/Render";

export interface createHoverPreviewStateModelParams {
  snapshot: AllocationSnapshot | null;
  hoveredNodeId: NodeId | null;
}

export function createHoverPreviewStateModel({
  snapshot,
  hoveredNodeId,
}: createHoverPreviewStateModelParams): HoverPreviewStateModel {
  const nodeIds = new Set<NodeId>();
  const edgeKeys = new Set<EdgeKey>();

  if (!snapshot || !hoveredNodeId) {
    return { hoveredNodeId, nodeIds, edgeKeys };
  }

  const hoveredState = snapshot.nodeStateById.get(hoveredNodeId);
  const path = hoveredState?.path ?? [];

  for (const nodeId of path) nodeIds.add(nodeId);
  for (let i = 1; i < path.length; i += 1) {
    edgeKeys.add(makeEdgeKey(path[i - 1]!, path[i]!));
  }

  return { hoveredNodeId, nodeIds, edgeKeys };
}
