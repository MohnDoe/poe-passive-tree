import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import { getNodeAllocationState } from "../selectors/getNodeAllocationState";
import { planAllocation } from "./planAllocation";
import { planRefund } from "./planRefund";
import type { BuildCommandContext, BuildCommandResult } from "./types";

export function planToggleAllocation(ctx: BuildCommandContext, nodeId: NodeId): BuildCommandResult {
  const nodeState = getNodeAllocationState(ctx.snapshot, nodeId);

  if (!nodeState) {
    return {
      ok: false,
      reason: "NODE_NOT_FOUND",
    };
  }

  return nodeState.allocated ? planRefund(ctx, nodeId) : planAllocation(ctx, nodeId);
}
