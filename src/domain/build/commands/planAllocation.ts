import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import { getActiveRootNodeIds } from "@/domain/passiveGraph/queries/getActiveRootNodeIds";
import { setsEqual } from "@/utils/utils";
import { computeWeightedPaths, materializePath } from "../algorithms/pathfinding";
import type { BuildCommandContext, BuildCommandResult } from "./types";

export function planAllocation(
  { graph, build }: BuildCommandContext,
  nodeId: NodeId,
): BuildCommandResult {
  const rootNodeIds = new Set(
    getActiveRootNodeIds(graph, build.activeClassId, build.activeAscendancy),
  );

  const { distanceByNodeId, predecessorByNodeId } = computeWeightedPaths({
    graph,
    rootNodeIds,
    allocatedNodeIds: build.allocatedNodeIds,
  });

  const distance = distanceByNodeId.get(nodeId);

  if (distance === undefined) return { ok: false, reason: "NODE_NOT_ALLOCATABLE" };

  const path = materializePath(nodeId, predecessorByNodeId);
  const nextAllocatedNodeIds = new Set(build.allocatedNodeIds);

  for (const pathNodeId of path) {
    nextAllocatedNodeIds.add(pathNodeId);
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
