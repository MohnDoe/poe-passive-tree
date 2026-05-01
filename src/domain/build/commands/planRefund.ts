import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import { getActiveRootNodeIds } from "@/domain/passiveGraph/queries/getActiveRootNodeIds";
import { computeDependencies } from "@/services/passiveTree/allocation/analysis/computeDependencies";
import { computeRefundClosure } from "@/services/passiveTree/allocation/analysis/refund";
import {
  computeWeightedPaths,
  materializePath,
} from "@/services/passiveTree/allocation/pathfinding/computeWeightedPaths";
import { setsEqual } from "@/utils/utils";
import type { BuildCommandContext, BuildCommandResult } from "./types";

export function planRefund(
  { graph, build }: BuildCommandContext,
  nodeId: NodeId,
): BuildCommandResult {
  const nodeState = build.allocatedNodeIds.has(nodeId);
  if (!nodeState) return { ok: false, reason: "NODE_NOT_ALLOCATED" };

  const rootNodeIds = new Set(
    getActiveRootNodeIds(graph, build.activeClassId, build.activeAscendancy),
  );

  const { predecessorByNodeId } = computeWeightedPaths({
    graph,
    rootNodeIds,
    allocatedNodeIds: build.allocatedNodeIds,
  });

  const pathByNodeId = new Map<NodeId, NodeId[]>();
  for (const allocatedId of build.allocatedNodeIds) {
    pathByNodeId.set(allocatedId, materializePath(allocatedId, predecessorByNodeId));
  }

  const { requiredByNodeId } = computeDependencies({
    allocatedNodeIds: build.allocatedNodeIds,
    pathByNodeId,
  });

  const refundedIds = computeRefundClosure(nodeId, build.allocatedNodeIds, requiredByNodeId);

  if (refundedIds.size === 0) {
    return {
      ok: false,
      reason: "NODE_NOT_REFUNDABLE",
    };
  }

  const nextAllocatedNodeIds = new Set(build.allocatedNodeIds);

  for (const refundedNodeId of refundedIds) {
    nextAllocatedNodeIds.delete(refundedNodeId);
  }

  if (setsEqual(nextAllocatedNodeIds, build.allocatedNodeIds)) {
    return {
      ok: false,
      reason: "NO_CHANGE",
    };
  }

  return {
    ok: true,
    build: {
      ...build,
      allocatedNodeIds: nextAllocatedNodeIds,
    },
  };
}
