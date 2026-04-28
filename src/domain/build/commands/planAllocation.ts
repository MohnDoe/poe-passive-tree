import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import { canAllocate } from "@/services/passiveTree/allocation/rules/allocation";
import { setsEqual } from "@/utils/utils";
import { getNodeAllocationState } from "../selectors/getNodeAllocationState";
import type { BuildCommandContext, BuildCommandResult } from "./types";

export function planAllocation(ctx: BuildCommandContext, nodeId: NodeId): BuildCommandResult {
  const nextAllocatedNodeIds = new Set<NodeId>(ctx.build.allocatedNodeIds);
  if (!canAllocate(ctx.snapshot, nodeId)) {
    return {
      ok: false,
      reason: "NODE_NOT_ALLOCATABLE",
    };
  }

  const nodeState = getNodeAllocationState(ctx.snapshot, nodeId);
  if (!nodeState) return { ok: false, reason: "NODE_NOT_FOUND" };
  const path = nodeState.path ?? [];

  for (const pathNodeId of path) {
    nextAllocatedNodeIds.add(pathNodeId);
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
