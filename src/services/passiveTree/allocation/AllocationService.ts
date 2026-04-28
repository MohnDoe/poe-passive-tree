import type { BuildState } from "@/domain/build/BuildState";
import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import { setsEqual } from "@/utils/utils";
import type {
  AllocationNodeState,
  AllocationResult,
  AllocationSnapshot,
} from "@/domain/build/allocation/Allocation";
import { buildAllocationSnapshot } from "./buildAllocationSnapshot";
import { analyzeRefundTarget } from "./analysis/refund";

interface AllocationSnapshotInputs {
  graph: PassiveGraph;
  buildState: BuildState;
}

export class AllocationService {
  private graph: PassiveGraph | null = null;
  private buildState: BuildState | null = null;
  private snapshot: AllocationSnapshot | null = null;

  setBuildState(state: BuildState): void {
    this.buildState = {
      allocatedNodeIds: new Set(state.allocatedNodeIds),
      activeClassId: state.activeClassId,
      activeAscendancy: state.activeAscendancy,
    };
  }

  setGraph(graph: PassiveGraph): void {
    this.graph = graph;
  }

  getSnapshot(): AllocationSnapshot | null {
    return this.snapshot;
  }

  hasSnapshot(): boolean {
    return this.snapshot !== null;
  }

  canAllocate(nodeId: NodeId): boolean {
    const snapshot = this.requireSnapshot();
    return snapshot.allocatableNodeIds.has(nodeId);
  }

  getNodeState(nodeId: NodeId): AllocationNodeState | null {
    return this.snapshot?.nodeStateById.get(nodeId) ?? null;
  }

  private tryRebuild() {
    if (!this.graph || !this.buildState) return;
    this.rebuild();
  }

  private requireSnapshot(): AllocationSnapshot {
    if (this.snapshot === null) throw new Error("Allocation snapshot is required");
    return this.snapshot;
  }

  private requireInputs(): AllocationSnapshotInputs {
    if (!this.graph || !this.buildState) throw new Error("AllocationService is missing inputs");

    return {
      graph: this.graph,
      buildState: this.buildState,
    };
  }

  rebuild(): AllocationSnapshot {
    console.log("[AllocationService] rebuild");
    const { graph, buildState } = this.requireInputs();

    const snapshot = buildAllocationSnapshot({
      graph,
      buildState,
    });

    console.log("[AllocationService] New snapshot");

    this.snapshot = snapshot;
    return snapshot;
  }

  planAllocation(nodeId: NodeId): AllocationResult {
    if (!this.snapshot || !this.buildState) {
      return { changed: false, nextAllocatedNodeIds: new Set() };
    }

    const nextAllocatedNodeIds = new Set<NodeId>(this.buildState.allocatedNodeIds);
    if (!this.canAllocate(nodeId)) {
      return {
        changed: false,
        nextAllocatedNodeIds,
      };
    }

    const path = this.getNodeState(nodeId)?.path ?? [];

    for (const pathNodeId of path) {
      nextAllocatedNodeIds.add(pathNodeId);
    }

    return {
      changed: !setsEqual(nextAllocatedNodeIds, this.buildState.allocatedNodeIds),
      nextAllocatedNodeIds,
    };
  }

  planRefund(nodeId: NodeId): AllocationResult {
    if (!this.snapshot || !this.buildState) {
      return { changed: false, nextAllocatedNodeIds: new Set() };
    }

    const analysis = analyzeRefundTarget(nodeId, this.snapshot.nodeStateById);

    if (!analysis.canRefund) {
      return {
        changed: false,
        nextAllocatedNodeIds: new Set(this.buildState.allocatedNodeIds),
      };
    }

    const nextAllocatedNodeIds = new Set(this.buildState.allocatedNodeIds);

    for (const refundedNodeId of analysis.refundedNodeIds) {
      nextAllocatedNodeIds.delete(refundedNodeId);
    }

    return {
      changed: !setsEqual(nextAllocatedNodeIds, this.buildState.allocatedNodeIds),
      nextAllocatedNodeIds,
    };
  }
}
