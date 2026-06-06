import type { AllocationState } from "@/domain/build/AllocationState";
import type { BuildState } from "@/domain/build/models/BuildState";
import type { HoverPreviewState } from "@/domain/build/models/allocation/HoverPreviewState";
import { Build } from "@/domain/build/Build";
import { makeEdgeKey, makeEdgeKeysFromPath } from "@/domain/graph/edgeKeys";
import type { EdgeKey } from "@/domain/graph/GraphEdge";
import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import type { NodeId } from "@/domain/graph/PassiveNode";

export interface ComputeHoverPreviewStateParams {
  allocationState: AllocationState | null;
  hoveredNodeId: NodeId | null;
  graph: PassiveGraph | null;
  build: BuildState;
}

const emptyHighlight = {
  nodeIds: new Set<NodeId>(),
  edgeKeys: new Set<EdgeKey>(),
};

export function computeHoverPreviewState({
  allocationState,
  hoveredNodeId,
  graph,
  build,
}: ComputeHoverPreviewStateParams): HoverPreviewState {
  const defaultPreviewState: HoverPreviewState = {
    hoveredNodeId,
    highlight: emptyHighlight,
    refund: emptyHighlight,
    tooltip: null,
  };

  if (!allocationState || !hoveredNodeId || !graph) {
    return defaultPreviewState;
  }

  const hoveredNode = graph.nodesById.get(hoveredNodeId);
  if (!hoveredNode) return defaultPreviewState;

  const makeTooltip = (budgetCost: number | null, budgetRefundCount: number | null) => ({
    name: hoveredNode.name,
    kind: hoveredNode.kind,
    stats: hoveredNode.stats,
    budget: { cost: budgetCost, refundCount: budgetRefundCount },
  });

  const hoveredNodeState = allocationState.nodeStateById.get(hoveredNodeId);
  if (!hoveredNodeState) {
    return { ...defaultPreviewState, tooltip: makeTooltip(null, null) };
  }
  if (!hoveredNodeState.reachable && !hoveredNodeState.allocated) {
    return { ...defaultPreviewState, tooltip: makeTooltip(null, null) };
  }

  if (hoveredNodeState.allocated) {
    const refundAnalysis = Build.computeRefundAnalysis(graph, build, hoveredNodeId);
    return {
      ...defaultPreviewState,
      refund: {
        nodeIds: refundAnalysis.refundedNodeIds,
        edgeKeys: refundAnalysis.refundedEdgeKeys,
      },
      tooltip: makeTooltip(null, refundAnalysis.refundedNodeIds.size),
    };
  }

  // Unallocated node
  const cheapestPath = hoveredNodeState.cheapestPath;
  if (!cheapestPath) return { ...defaultPreviewState, tooltip: makeTooltip(null, null) };

  const highlightedNodeIds = new Set<NodeId>(
    cheapestPath.filter(
      (id) =>
        !allocationState.allocatedNodeIds.has(id) && allocationState.allocatableNodeIds.has(id),
    ),
  );
  highlightedNodeIds.add(hoveredNodeId);

  const highlightedEdgeKeys = makeEdgeKeysFromPath({ path: cheapestPath });

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

  return {
    ...defaultPreviewState,
    highlight: {
      nodeIds: highlightedNodeIds,
      edgeKeys: highlightedEdgeKeys,
    },
    tooltip: makeTooltip(highlightedNodeIds.size, null),
  };
}
