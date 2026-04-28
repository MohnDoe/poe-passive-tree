import type { ClassId } from "@/domain/passiveGraph/PassiveClass";
import type { BuildState } from "../models/BuildState";

export function setClass(build: BuildState, classId: ClassId): BuildState {
  if (build.activeClassId === classId) return build;

  return {
    ...build,
    activeClassId: classId,
    activeAscendancy: null,
    allocatedNodeIds: new Set(),
  };
}
