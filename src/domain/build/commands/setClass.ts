import type { ClassId } from "@/domain/graph/PassiveClass";
import type { BuildState } from "../models/BuildState";
import { createEmptyBuild } from "@/stores/build.store";

export function setClass(build: BuildState, classId: ClassId): BuildState {
  if (build.activeClassId === classId) return build;

  return {
    ...createEmptyBuild(),
    activeClassId: classId,
    activeAscendancy: null,
    allocatedNodeIds: new Set(),
  };
}
