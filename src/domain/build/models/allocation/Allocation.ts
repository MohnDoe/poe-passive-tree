import type { EdgeKey } from "@/domain/graph/GraphEdge";
import type { ClassId } from "@/domain/graph/PassiveClass";
import type { NodeId } from "@/domain/graph/PassiveNode";

export interface AllocationNodeState {
  id: NodeId;

  // There is a valid path from a root
  reachable: boolean;
  // reachable and allowed by rules
  allocatable: boolean;

  allocated: boolean;

  path: NodeId[] | null;
  pathCost: number | null;

  dependsOn: Set<NodeId>;
  requiredBy: ReadonlySet<NodeId>;
}

export interface AllocationState {
  activeClassId: ClassId | null;

  rootNodeIds: Set<NodeId>;

  allocatedNodeIds: ReadonlySet<NodeId>;
  allocatableNodeIds: ReadonlySet<NodeId>;

  activeEdgeKeys: ReadonlySet<EdgeKey>;

  nodeStateById: Map<NodeId, AllocationNodeState>;
}
