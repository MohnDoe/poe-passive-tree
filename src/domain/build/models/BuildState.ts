import type { AscendancyId } from "@/domain/graph/PassiveAscendancy";
import type { ClassId } from "@/domain/graph/PassiveClass";
import type { NodeId } from "@/domain/graph/PassiveNode";

export interface BuildState {
  allocatedNodeIds: Set<NodeId>;
  activeClassId: ClassId | null;
  activeAscendancy: AscendancyId | null;
  passivePointsBudget: number;
  ascendancyPointsBudget: number;
}
