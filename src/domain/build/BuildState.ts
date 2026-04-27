import type { AscendancyId } from "../passiveGraph/PassiveAscendancy";
import type { ClassId } from "../passiveGraph/PassiveClass";
import type { NodeId } from "../passiveGraph/PassiveNode";

export interface BuildState {
  allocatedNodeIds: Set<NodeId>;
  activeClassId: ClassId | null;
  activeAscendancy: AscendancyId | null;
}
