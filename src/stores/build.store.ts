import type { BuildState } from "@/domain/build/BuildState";
import type { AscendancyId } from "@/domain/passiveGraph/PassiveAscendancy";
import type { ClassId } from "@/domain/passiveGraph/PassiveClass";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

import { defineStore } from "pinia";

export type BuildStoreState = BuildState;

export const useBuildStore = defineStore("build", {
  state: (): BuildStoreState => ({
    allocatedNodeIds: new Set<NodeId>(),
    activeClassId: null,
    activeAscendancy: null,
  }),

  getters: {
    totalPointsSpent: (state) => state.allocatedNodeIds.size,
    isAllocated(state): (nodeId: NodeId) => boolean {
      return (nodeId) => state.allocatedNodeIds.has(nodeId);
    },
  },
  actions: {
    resetBuild() {
      this.resetAllocations();
      this.activeAscendancy = null;
    },
    resetAllocations() {
      this.allocatedNodeIds.clear();
    },
    setClass(classId: ClassId) {
      if (this.activeClassId === classId) return;

      this.resetBuild();
      this.activeClassId = classId;
      this.setAscendancy(null);
    },
    setAscendancy(ascendancyId: AscendancyId | null): void {
      if (this.activeAscendancy === ascendancyId) return;
      // TODO: check if new Ascendancy is related to current selected class
      // or maybe just change the class either way with this.setClass()

      // this.resetBuild();
      this.activeAscendancy = ascendancyId;
    },
    applyAllocatedNodeIds(nodeIds: ReadonlySet<NodeId>): void {
      this.allocatedNodeIds = new Set(nodeIds);
    },
  },
});
