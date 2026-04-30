import type { AscendancyId } from "@/domain/passiveGraph/PassiveAscendancy";
import type { ClassId } from "@/domain/passiveGraph/PassiveClass";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

export interface BuildState {
  allocatedNodeIds: Set<NodeId>;
  activeClassId: ClassId | null;
  activeAscendancy: AscendancyId | null;
  passivePointsBudget: number;
  ascendancyPointsBudget: number;
}
