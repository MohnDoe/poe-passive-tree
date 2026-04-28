import type { ClassId } from "@/domain/passiveGraph/PassiveClass";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

export interface AllocationNodeState {
  id: NodeId;

  // There is a valid path from a root
  reachable: boolean;
  // allocated and still attached to active  allocated tree
  connectedToStart: boolean;
  // reachable and allowed by rules
  allocatable: boolean;

  allocated: boolean;

  path: NodeId[] | null;
  pathCost: number | null;

  dependsOn: Set<NodeId>;
  requiredBy: ReadonlySet<NodeId>;
}

export interface AllocationSnapshot {
  activeClassId: ClassId | null;

  rootNodeIds: Set<NodeId>;

  allocatedNodeIds: ReadonlySet<NodeId>;
  allocatableNodeIds: ReadonlySet<NodeId>;

  nodeStateById: Map<NodeId, AllocationNodeState>;
}
