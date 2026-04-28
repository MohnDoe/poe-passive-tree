import { defineStore } from "pinia";
import { markRaw, watch, type WatchStopHandle } from "vue";

import { AllocationService } from "@/services/passiveTree/allocation/AllocationService";
import { useRuntimeStore } from "@/stores/runtime.store";
import { useBuildStore } from "@/stores/build.store";

import type { AllocationSnapshot } from "@/domain/build/allocation/Allocation";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

const allocationService = markRaw(new AllocationService());

let stopSync: WatchStopHandle | null = null;

interface AllocationStoreState {
  snapshot: AllocationSnapshot | null;
  initialized: boolean;
}

export const useAllocationStore = defineStore("allocation", {
  state: (): AllocationStoreState => ({
    snapshot: null,
    initialized: false,
  }),

  getters: {
    hasSnapshot: (state): boolean => state.snapshot !== null,

    // TODO: evaluate if beneficial to have here

    // allocatableNodeIds: (state): Set<NodeId> => {
    //   const result = new Set<NodeId>();
    //   if (!state.snapshot) return result;
    //
    //   for (const [nodeId, nodeState] of state.snapshot.nodeStateById) {
    //     if (nodeState.allocatable) {
    //       result.add(nodeId);
    //     }
    //   }
    //
    //   return result;
    // },
    //
    // allocatedNodeIds: (state): Set<NodeId> => {
    //   if (!state.snapshot) return new Set<NodeId>();
    //   return new Set(state.snapshot.allocatedNodeIds);
    // },
    // canAllocate:
    //   (state) =>
    //   (nodeId: NodeId): boolean => {
    //     return state.snapshot?.nodeStateById.get(nodeId)?.allocatable ?? false;
    //   },
    //   canRefund()

    getNodeState: (state) => (nodeId: NodeId) => {
      return state.snapshot?.nodeStateById.get(nodeId) ?? null;
    },
  },

  actions: {
    initialize(): void {
      if (this.initialized) return;

      const runtimeStore = useRuntimeStore();
      const buildStore = useBuildStore();

      stopSync = watch(
        () =>
          [
            runtimeStore.graph,
            buildStore.allocatedNodeIds,
            buildStore.activeClassId,
            buildStore.activeAscendancy,
          ] as const,
        () => {
          this.syncFromInputs();
        },
        { immediate: true },
      );

      this.initialized = true;
    },

    dispose(): void {
      stopSync?.();
      stopSync = null;

      this.snapshot = null;
      this.initialized = false;
    },

    syncFromInputs(): void {
      const runtimeStore = useRuntimeStore();
      const buildStore = useBuildStore();

      console.log("[AllocationStore] Syncing snapshot");

      if (!runtimeStore.graph || buildStore.activeClassId === null) {
        this.snapshot = null;
        console.log("[AllocationStore] Snapshot cancelled");
        return;
      }

      allocationService.setGraph(runtimeStore.graph);
      allocationService.setBuildState({
        allocatedNodeIds: new Set(buildStore.allocatedNodeIds),
        activeClassId: buildStore.activeClassId,
        activeAscendancy: buildStore.activeAscendancy,
      });

      allocationService.rebuild();
      this.snapshot = allocationService.getSnapshot();
    },

    commitAllocation(nodeId: NodeId): boolean {
      const buildStore = useBuildStore();

      if (!this.snapshot) return false;

      const plan = allocationService.planAllocation(nodeId);
      if (!plan || !plan.changed) return false;

      buildStore.applyAllocatedNodeIds(plan.nextAllocatedNodeIds);
      return true;
    },

    commitRefund(nodeId: NodeId): boolean {
      const buildStore = useBuildStore();

      if (!this.snapshot) return false;

      const plan = allocationService.planRefund(nodeId);
      if (!plan || !plan.changed) return false;

      buildStore.applyAllocatedNodeIds(plan.nextAllocatedNodeIds);
      return true;
    },

    toggleNode(nodeId: NodeId): boolean {
      const nodeState = this.getNodeState(nodeId);
      if (!nodeState) return false;

      if (nodeState.allocated) {
        return this.commitRefund(nodeId);
      }

      return this.commitAllocation(nodeId);
    },
  },
});
