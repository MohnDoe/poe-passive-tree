import type { NodeId } from "@/domain/graph/PassiveNode";
import { planAllocation } from "./planAllocation";
import { planRefund } from "./planRefund";
import type { BuildCommandContext, BuildCommandResult } from "./types";

export function planToggleAllocation(ctx: BuildCommandContext, nodeId: NodeId): BuildCommandResult {
  const { graph, build } = ctx;
  const node = graph.nodesById.get(nodeId);
  if (!node) {
    return {
      ok: false,
      reason: "NODE_NOT_FOUND",
    };
  }

  return build.allocatedNodeIds.has(nodeId) ? planRefund(ctx, nodeId) : planAllocation(ctx, nodeId);
}
