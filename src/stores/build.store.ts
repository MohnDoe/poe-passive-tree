import type { BuildState } from "@/domain/build/models/BuildState";
import type { ClassId } from "@/domain/passiveGraph/PassiveClass";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import type { BuildCommandResult } from "@/domain/build/commands/types";
import type { AscendancyId } from "@/domain/passiveGraph/PassiveAscendancy";

import { createBuildCommandContext } from "@/domain/build/commands/createBuildCommandContext";
import { planToggleAllocation } from "@/domain/build/commands/planToggleAllocation";
import { setAscendancy } from "@/domain/build/commands/setAscendancy";
import { setClass } from "@/domain/build/commands/setClass";
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
    passivePointsBudget: 123, // TODO: better
    ascendancyPointsBudget: 8,
  };
}

export function cloneBuild(build: BuildState): BuildState {
  return {
    ...build,
    allocatedNodeIds: new Set(build.allocatedNodeIds),
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

  getters: {},
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

      if (result.ok) this.build = result.build;

      return result;
    },
    toggleNode(nodeId: NodeId): BuildCommandResult {
      const runtimeStore = useRuntimeStore();
      const graph = runtimeStore.graph;

      if (!graph) return { ok: false, reason: "NO_ACTIVE_CLASS" };

      const result = planToggleAllocation(createBuildCommandContext(graph, this.build), nodeId);

      if (result.ok) this.build = result.build;

      return result;
    },
  },
});
