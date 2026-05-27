import type { ClassId } from "@/domain/graph/PassiveClass";
import type { BuildState } from "../models/BuildState";
import { Build } from "../Build";

export function setClass(build: BuildState, classId: ClassId): BuildState {
  const result = Build.setClass(build, classId);
  if (result.isErr()) {
    return build;
  }
  return result.value;
}
