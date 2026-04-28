import type { BuildState } from "@/domain/build/models/BuildState";
import type { ClassId } from "@/domain/passiveGraph/PassiveClass";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

import { planToggleAllocation } from "@/domain/build/commands/planToggleAllocation";
import { setAscendancy } from "@/domain/build/commands/setAscendancy";
import { setClass } from "@/domain/build/commands/setClass";
import type { BuildCommandResult } from "@/domain/build/commands/types";
import type { AscendancyId } from "@/domain/passiveGraph/PassiveAscendancy";
import { buildAllocationSnapshot } from "@/services/passiveTree/allocation/buildAllocationSnapshot";
import { defineStore } from "pinia";
import { useRuntimeStore } from "./runtime.store";

export interface BuildStoreState {
  build: BuildState;
}

export function createEmptyBuild(): BuildState {
  return {
    allocatedNodeIds: new Set(),
    activeClassId: null,
    activeAscendancy: null,
  };
}

export function cloneBuild(build: BuildState): BuildState {
  return {
    allocatedNodeIds: new Set(build.allocatedNodeIds),
    activeClassId: build.activeClassId,
    activeAscendancy: build.activeAscendancy,
  };
}

export function resetAllocations(build: BuildState): BuildState {
  return {
    ...cloneBuild(build),
    allocatedNodeIds: new Set(),
  };
}

export const useBuildStore = defineStore("build", {
  state: (): BuildStoreState => ({
    build: createEmptyBuild(),
  }),

  getters: {
    // totalPointsSpent: (state) => state.allocatedNodeIds.size,
    // isAllocated(state): (nodeId: NodeId) => boolean {
    //   return (nodeId) => state.allocatedNodeIds.has(nodeId);
    // },
  },
  actions: {
    resetBuild() {
      this.build = createEmptyBuild();
    },
    setClass(classId: ClassId) {
      this.build = setClass(this.build, classId);
    },
    setAscendancy(ascendancyId: AscendancyId | null): BuildCommandResult {
      const { graph } = useRuntimeStore();

      if (!graph) return { ok: false, reason: "NO_ACTIVE_CLASS" };
      const result = setAscendancy(this.build, graph, ascendancyId);

      if (result.ok) {
        // do something
      }

      return result;
    },
    // allocate(nodeId: NodeId): BuildCommandContext {},
    // refund(nodeId: NodeId): BuildCommandContext {},
    toggleNode(nodeId: NodeId): BuildCommandResult {
      const runtimeStore = useRuntimeStore();
      const graph = runtimeStore.graph;

      if (!graph) return { ok: false, reason: "NO_ACTIVE_CLASS" };

      const snapshot = buildAllocationSnapshot({ graph, buildState: this.build });
      const result = planToggleAllocation({ graph, build: this.build, snapshot }, nodeId);

      if (result.ok) this.build = result.build;

      return result;
    },
  },
});
