import type { Result } from "neverthrow";
import { ok, err } from "neverthrow";
import { computeDependencies } from "@/domain/build/algorithms/dependencies";
import { computeRefundClosure } from "@/domain/build/algorithms/refund";
import { computeWeightedPaths, materializePath } from "@/domain/build/algorithms/pathfinding";
import type { BuildState } from "@/domain/build/models/BuildState";
import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import type { NodeId } from "@/domain/graph/PassiveNode";
import { getActiveRootNodeIds } from "@/domain/graph/queries/getActiveRootNodeIds";

export type BuildFailureReason =
  | "NO_ACTIVE_CLASS"
  | "NODE_NOT_FOUND"
  | "NODE_NOT_ALLOCATABLE"
  | "NODE_NOT_ALLOCATED"
  | "INVALID_ASCENDANCY_FOR_CLASS"
  | "NO_CHANGE";

export class Build {
  static allocate(
    graph: PassiveGraph,
    build: BuildState,
    nodeId: NodeId,
  ): Result<BuildState, BuildFailureReason> {
    if (build.activeClassId === null) {
      return err("NO_ACTIVE_CLASS");
    }

    const rootNodeIds = new Set(
      getActiveRootNodeIds(graph, build.activeClassId, build.activeAscendancy),
    );

    if (rootNodeIds.size === 0) {
      return err("NODE_NOT_ALLOCATABLE");
    }

    if (build.allocatedNodeIds.has(nodeId) || rootNodeIds.has(nodeId)) {
      return err("NODE_NOT_ALLOCATABLE");
    }

    const { distanceByNodeId, predecessorByNodeId } = computeWeightedPaths({
      graph,
      rootNodeIds,
      allocatedNodeIds: build.allocatedNodeIds,
    });

    const distance = distanceByNodeId.get(nodeId);

    if (distance === undefined) {
      return err("NODE_NOT_ALLOCATABLE");
    }

    const path = materializePath(nodeId, predecessorByNodeId);
    const nextAllocatedNodeIds = new Set(build.allocatedNodeIds);

    for (const pathNodeId of path) {
      nextAllocatedNodeIds.add(pathNodeId);
    }

    return ok({
      ...build,
      allocatedNodeIds: nextAllocatedNodeIds,
    });
  }

  static refund(
    graph: PassiveGraph,
    build: BuildState,
    nodeId: NodeId,
  ): Result<BuildState, BuildFailureReason> {
    if (build.activeClassId === null) {
      return err("NO_ACTIVE_CLASS");
    }

    if (!graph.nodesById.has(nodeId)) {
      return err("NODE_NOT_FOUND");
    }

    if (!build.allocatedNodeIds.has(nodeId)) {
      return err("NODE_NOT_ALLOCATED");
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

    return ok({
      ...build,
      allocatedNodeIds: nextAllocatedNodeIds,
    });
  }
}
