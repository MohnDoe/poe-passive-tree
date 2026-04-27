import type { GraphEdge } from "./GraphEdge";
import type { ClassId } from "./PassiveClass";
import type { NodeId, PassiveNode, PassiveNodeRegion, PassiveNodeSubregion } from "./PassiveNode";
import type { PassiveTreeData } from "./PassiveTreeData";

export type PassiveTreeAdjacency = ReadonlyMap<NodeId, Set<NodeId>>;

export type PassiveTreeNodesById = ReadonlyMap<NodeId, PassiveNode>;

export interface PassiveGraph extends PassiveTreeData {
  adjacency: PassiveTreeAdjacency;

  regionByNodeId: ReadonlyMap<NodeId, PassiveNodeRegion>;
  subregionByNodeId: ReadonlyMap<NodeId, PassiveNodeSubregion>;

  startNodeIdsByClassId: ReadonlyMap<ClassId, ReadonlySet<NodeId>>;
  allStartNodeIds: ReadonlySet<NodeId>;
  classByStartNodeId: ReadonlyMap<NodeId, ClassId>;

  // nodeIdsByGroupId: ReadonlyMap<GroupId, ReadonlySet<NodeId>>;

  // masteryNodeIds: ReadonlySet<NodeId>;
  // jewelSocketNodeIds: ReadonlySet<NodeId>;

  ascendancyStartNodeIds: ReadonlySet<NodeId>;

  edges: readonly GraphEdge[];
  // edgeIdsByNodeId: ReadonlyMap<NodeId, string>;
}
