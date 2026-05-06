import type { EdgeKey } from "@/domain/graph/GraphEdge";
import type { ClassId } from "@/domain/graph/PassiveClass";
import type { NodeId } from "@/domain/graph/PassiveNode";

export interface AllocationNodeState {
  id: NodeId;

  // There is a valid path to it from a root
  reachable: boolean;

  // The node is *reachable* AND path cost fits point budget and/or rule set
  allocatable: boolean;

  allocated: boolean;

  // Cheapest path to any root
  cheapestPath: NodeId[] | null;
  cheapestPathCost: number | null;

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
