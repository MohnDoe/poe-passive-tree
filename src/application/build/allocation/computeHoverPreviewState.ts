import type { AllocationState } from "@/domain/build/models/allocation/Allocation";
import type { HoverPreviewState } from "@/domain/build/models/allocation/HoverPreviewState";
import { getRefundAnalysis } from "@/domain/build/selectors/getRefundAnalysis";
import { makeEdgeKey, makeEdgeKeysFromPath } from "@/domain/graph/edgeKeys";
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

  if (!allocationState || !hoveredNodeId || !graph) {
    return previewState;
  }

  const hoveredNodeState = allocationState.nodeStateById.get(hoveredNodeId);
  if (!hoveredNodeState) return previewState;

  console.log("hovered node state", hoveredNodeState);

  if (!hoveredNodeState.reachable && !hoveredNodeState.allocated) {
    return previewState;
  }

  if (hoveredNodeState.allocated) {
    const refundAnalysis = getRefundAnalysis(hoveredNodeId, allocationState.nodeStateById, graph);
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

    const highlightedEdgeKeys = makeEdgeKeysFromPath({ path: fullPath });

    // For every node in the path (including hovered), add edges to any allocated neighbor.
    // This covers: direct connections, loop-closing, and edges from intermediate
    // path nodes to already-allocated nodes not on the BFS path.
    for (const pathNodeId of highlightedNodeIds) {
      for (const neighborId of graph.adjacency.get(pathNodeId) ?? []) {
        if (allocationState.allocatedNodeIds.has(neighborId)) {
          highlightedEdgeKeys.add(makeEdgeKey(pathNodeId, neighborId));
        }
      }
    }

    previewState = {
      ...previewState,
      highlight: {
        nodeIds: highlightedNodeIds,
        edgeKeys: highlightedEdgeKeys,
      },
    };
  }

  console.log("previewState", previewState);

  return previewState;
}
