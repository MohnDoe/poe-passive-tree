import type { Result } from "neverthrow";
import type { BuildState } from "@/domain/build/models/BuildState";
import type { ClassId } from "@/domain/graph/PassiveClass";
import type { NodeId } from "@/domain/graph/PassiveNode";
import type { AscendancyId } from "@/domain/graph/PassiveAscendancy";
import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import { Build, type BuildFailureReason } from "@/domain/build/Build";
import { defineStore } from "pinia";

export interface BuildStoreState {
  build: BuildState;
}

export function createDefaultBuild(): BuildState {
  return {
    allocatedNodeIds: new Set(),
    activeClassId: 3,
    activeAscendancy: "Necromancer",
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
    build: createDefaultBuild(),
  }),

  getters: {},
  actions: {
    resetBuild() {
      this.build = createDefaultBuild();
    },
    setClass(classId: ClassId): Result<BuildState, BuildFailureReason> {
      const result = Build.setClass(this.build, classId);
      if (result.isOk()) this.build = result.value;
      return result;
    },
    setAscendancy(
      graph: PassiveGraph,
      ascendancyId: AscendancyId | null,
    ): Result<BuildState, BuildFailureReason> {
      const result = Build.setAscendancy(graph, this.build, ascendancyId);
      if (result.isOk()) this.build = result.value;
      return result;
    },
    toggleNode(graph: PassiveGraph, nodeId: NodeId): Result<BuildState, BuildFailureReason> {
      const result = Build.toggle(graph, this.build, nodeId);
      if (result.isOk()) this.build = result.value;
      return result;
    },
  },
});
