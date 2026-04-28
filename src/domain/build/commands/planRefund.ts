import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import { analyzeRefundTarget } from "@/services/passiveTree/allocation/analysis/refund";
import { setsEqual } from "@/utils/utils";
import type { BuildCommandContext, BuildCommandResult } from "./types";

export function planRefund(ctx: BuildCommandContext, nodeId: NodeId): BuildCommandResult {
  const analysis = analyzeRefundTarget(nodeId, ctx.snapshot.nodeStateById);

  if (!analysis.canRefund) {
    return {
      ok: false,
      reason: "NODE_NOT_REFUNDABLE",
    };
  }

  const nextAllocatedNodeIds = new Set(ctx.build.allocatedNodeIds);

  for (const refundedNodeId of analysis.refundedNodeIds) {
    nextAllocatedNodeIds.delete(refundedNodeId);
  }

  if (setsEqual(nextAllocatedNodeIds, ctx.build.allocatedNodeIds)) {
    return {
      ok: false,
      reason: "NO_CHANGE",
    };
  }

  return {
    ok: true,
    build: {
      ...ctx.build,
      allocatedNodeIds: nextAllocatedNodeIds,
    },
  };
}
