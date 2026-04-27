import type { ClassId } from "@/domain/passiveGraph/PassiveClass";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

export interface AllocationNodeState {
  id: NodeId;
  connectedToStart: boolean;
  allocatable: boolean;
  allocated: boolean;
  path: NodeId[] | null;
  pathCost: number | null;
  dependsOn: Set<NodeId>;
  requiredBy: ReadonlySet<NodeId>;
}

export interface AllocationResult {
  changed: boolean;
  nextAllocatedNodeIds: ReadonlySet<NodeId>;
  // activeStartNodeIds: ReadonlySet<NodeId>;
  // reachableNodeIds: ReadonlySet<NodeId>;
  // allocatableNodeIds: ReadonlySet<NodeId>;
  // affectedNodeIds: ReadonlySet<NodeId>;
  // affectedEdgeKeys: ReadonlySet<EdgeKey>;
}

export interface AllocationSnapshot {
  activeClassId: ClassId | null;

  rootNodeIds: Set<NodeId>;

  allocatedNodeIds: ReadonlySet<NodeId>;
  allocatableNodeIds: ReadonlySet<NodeId>;

  nodeStateById: Map<NodeId, AllocationNodeState>;
}
