import type { BuildState } from "@/domain/build/BuildState";
import type { PassiveGraph } from "@/domain/passiveGraph/PassiveGraph";
import type { AllocationSnapshot } from "../../../domain/build/allocation/Allocation";
import { buildAllocationSnapshot } from "./buildAllocationSnapshot";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

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
    return snapshot.allocatedNodeIds.has(nodeId);
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
    console.log(snapshot);

    this.snapshot = snapshot;
    return snapshot;
  }
}
