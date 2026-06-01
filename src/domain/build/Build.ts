import type { Result } from "neverthrow";
import { ok, err } from "neverthrow";
import {
  computeDependencies,
  computeRefundClosure,
  computeRefundEdgeKeys,
  computeWeightedPaths,
  materializePath,
} from "@/domain/build/internal";
import type { ClassId } from "@/domain/graph/PassiveClass";
import type { BuildState } from "@/domain/build/models/BuildState";
import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import type { NodeId } from "@/domain/graph/PassiveNode";
import type { AscendancyId } from "@/domain/graph/PassiveAscendancy";
import type { EdgeKey } from "@/domain/graph/GraphEdge";

export interface RefundAnalysis {
  canRefund: boolean;
  refundedNodeIds: ReadonlySet<NodeId>;
  refundedEdgeKeys: ReadonlySet<EdgeKey>;
}

export type BuildFailureReason =
  | "NO_ACTIVE_CLASS"
  | "NODE_NOT_FOUND"
  | "NODE_NOT_ALLOCATABLE"
  | "NODE_NOT_ALLOCATED"
  | "INVALID_ASCENDANCY_FOR_CLASS"
  | "NO_CHANGE";

export class Build {
  static toggle(
    graph: PassiveGraph,
    build: BuildState,
    nodeId: NodeId,
  ): Result<BuildState, BuildFailureReason> {
    if (!graph.nodesById.has(nodeId)) {
      return err("NODE_NOT_FOUND");
    }

    return build.allocatedNodeIds.has(nodeId)
      ? Build.refund(graph, build, nodeId)
      : Build.allocate(graph, build, nodeId);
  }

  static allocate(
    graph: PassiveGraph,
    build: BuildState,
    nodeId: NodeId,
  ): Result<BuildState, BuildFailureReason> {
    if (build.activeClassId === null) {
      return err("NO_ACTIVE_CLASS");
    }

    const startNodeIds = graph.getBuildStartNodeIds(build.activeClassId, build.activeAscendancy);

    if (startNodeIds.size === 0 || startNodeIds.has(nodeId)) {
      return err("NODE_NOT_ALLOCATABLE");
    }

    if (build.allocatedNodeIds.has(nodeId)) {
      return err("NODE_NOT_ALLOCATABLE");
    }

    const { distanceByNodeId, predecessorByNodeId } = computeWeightedPaths({
      graph,
      startNodeIds,
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

    const { requiredByNodeId } = computeDependencies({
      graph,
      startNodeIds: graph.getBuildStartNodeIds(build.activeClassId, build.activeAscendancy),
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

  static setClass(build: BuildState, classId: ClassId): Result<BuildState, BuildFailureReason> {
    if (build.activeClassId === classId) {
      return err("NO_CHANGE");
    }

    return ok({
      ...build,
      activeClassId: classId,
      activeAscendancy: null,
      allocatedNodeIds: new Set(),
    });
  }

  static computeRefundAnalysis(
    graph: PassiveGraph,
    build: BuildState,
    nodeId: NodeId,
  ): RefundAnalysis {
    if (!graph.nodesById.has(nodeId)) {
      return {
        canRefund: false,
        refundedNodeIds: new Set(),
        refundedEdgeKeys: new Set(),
      };
    }

    if (!build.allocatedNodeIds.has(nodeId)) {
      return {
        canRefund: false,
        refundedNodeIds: new Set(),
        refundedEdgeKeys: new Set(),
      };
    }

    const { requiredByNodeId } = computeDependencies({
      graph,
      startNodeIds: graph.getBuildStartNodeIds(build.activeClassId!, build.activeAscendancy),
      allocatedNodeIds: build.allocatedNodeIds,
    });

    const refundedNodeIds = computeRefundClosure(nodeId, build.allocatedNodeIds, requiredByNodeId);
    const refundedEdgeKeys = computeRefundEdgeKeys(refundedNodeIds, build.allocatedNodeIds, graph);

    return {
      canRefund: refundedNodeIds.size > 0,
      refundedNodeIds,
      refundedEdgeKeys,
    };
  }

  static setAscendancy(
    graph: PassiveGraph,
    build: BuildState,
    ascendancyId: AscendancyId | null,
  ): Result<BuildState, BuildFailureReason> {
    if (build.activeClassId === null) {
      return err("NO_ACTIVE_CLASS");
    }

    if (build.activeAscendancy === ascendancyId) {
      return err("NO_CHANGE");
    }

    if (
      ascendancyId !== null &&
      !graph.isValidAscendancyForClass(build.activeClassId, ascendancyId)
    ) {
      return err("INVALID_ASCENDANCY_FOR_CLASS");
    }

    const nextAllocatedNodeIds = new Set(
      [...build.allocatedNodeIds].filter(
        (nodeId) => graph.regionByNodeId.get(nodeId) !== "ascendancy",
      ),
    );

    return ok({
      ...build,
      activeAscendancy: ascendancyId,
      allocatedNodeIds: nextAllocatedNodeIds,
    });
  }
}
