import { computeDependencies } from "@/domain/build/algorithms/dependencies";
import { computeRefundClosure } from "@/domain/build/algorithms/refund";
import type { NodeId } from "@/domain/graph/PassiveNode";
import { getActiveRootNodeIds } from "@/domain/graph/queries/getActiveRootNodeIds";
import type { BuildCommandContext, BuildCommandResult } from "./types";

export function planRefund(
  { graph, build }: BuildCommandContext,
  nodeId: NodeId,
): BuildCommandResult {
  if (!graph.nodesById.has(nodeId)) return { ok: false, reason: "NODE_NOT_FOUND" };

  if (!build.allocatedNodeIds.has(nodeId)) {
    return { ok: false, reason: "NODE_NOT_ALLOCATED" };
  }

  const rootNodeIds = new Set(
    getActiveRootNodeIds(graph, build.activeClassId, build.activeAscendancy),
  );

  const { requiredByNodeId } = computeDependencies({
    graph,
    rootNodeIds,
    allocatedNodeIds: build.allocatedNodeIds,
  });

  const refundedIds = computeRefundClosure(nodeId, build.allocatedNodeIds, requiredByNodeId);

  const nextAllocatedNodeIds = new Set(build.allocatedNodeIds);
  for (const refundedNodeId of refundedIds) {
    nextAllocatedNodeIds.delete(refundedNodeId);
  }

  return {
    ok: true,
    build: {
      ...build,
      allocatedNodeIds: nextAllocatedNodeIds,
    },
  };
}
