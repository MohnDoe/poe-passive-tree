import { computeWeightedPaths, materializePath } from "@/domain/build/algorithms/pathfinding";
import type { NodeId } from "@/domain/graph/PassiveNode";
import { getActiveRootNodeIds } from "@/domain/graph/queries/getActiveRootNodeIds";
import type { BuildCommandContext, BuildCommandResult } from "./types";

export function planAllocation(
  { graph, build }: BuildCommandContext,
  nodeId: NodeId,
): BuildCommandResult {
  if (build.activeClassId === null) {
    return { ok: false, reason: "NO_ACTIVE_CLASS" };
  }

  const rootNodeIds = new Set(
    getActiveRootNodeIds(graph, build.activeClassId, build.activeAscendancy),
  );

  if (rootNodeIds.size === 0) {
    return { ok: false, reason: "NODE_NOT_ALLOCATABLE" };
  }

  if (build.allocatedNodeIds.has(nodeId) || rootNodeIds.has(nodeId)) {
    return { ok: false, reason: "NODE_NOT_ALLOCATABLE" };
  }

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

  return {
    ok: true,
    build: {
      ...build,
      allocatedNodeIds: nextAllocatedNodeIds,
    },
  };
}
