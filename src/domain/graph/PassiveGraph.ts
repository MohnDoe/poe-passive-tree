import type { EdgeKey, GraphEdge } from "./GraphEdge";
import type { AscendancyId } from "./PassiveAscendancy";
import type { ClassId } from "./PassiveClass";
import type { NodeId, PassiveNode, PassiveNodeRegion, PassiveNodeSubregion } from "./PassiveNode";
import type { PassiveTreeData } from "./PassiveTreeData";

export type PassiveTreeAdjacency = ReadonlyMap<NodeId, Set<NodeId>>;

export type PassiveTreeNodesById = ReadonlyMap<NodeId, PassiveNode>;

export interface PassiveGraph extends PassiveTreeData {
  adjacency: PassiveTreeAdjacency;

  regionByNodeId: ReadonlyMap<NodeId, PassiveNodeRegion>;
  subregionByNodeId: ReadonlyMap<NodeId, PassiveNodeSubregion>;

  //TODO: remove this as it's useless
  allStartNodeIds: ReadonlySet<NodeId>;

  startNodeIdsByClassId: ReadonlyMap<ClassId, ReadonlySet<NodeId>>;
  classByStartNodeId: ReadonlyMap<NodeId, ClassId>;

  // nodeIdsByGroupId: ReadonlyMap<GroupId, ReadonlySet<NodeId>>;

  // masteryNodeIds: ReadonlySet<NodeId>;
  // jewelSocketNodeIds: ReadonlySet<NodeId>;

  ascendancyStartNodeIds: ReadonlySet<NodeId>;
  ascendancyStartNodeIdsByAscendancyId: ReadonlyMap<AscendancyId, ReadonlySet<NodeId>>;
  ascendancyIdsByClassId: ReadonlyMap<ClassId, ReadonlySet<AscendancyId>>;

  edges: readonly GraphEdge[];
  // edgeIdsByNodeId: ReadonlyMap<NodeId, string>;

  getBuildRootNodeIds(
    classId: ClassId | null,
    ascendancyId: AscendancyId | null,
  ): ReadonlySet<NodeId>;
  getBuildStartNodeIds(
    classId: ClassId | null,
    ascendancyId: AscendancyId | null,
  ): ReadonlySet<NodeId>;
  getClassStartNodeIds(classId: ClassId | null): ReadonlySet<NodeId>;
  getAscendancyStartNodeIds(ascendancyId: AscendancyId | null): ReadonlySet<NodeId>;
  isValidAscendancyForClass(classId: ClassId, ascendancyId: AscendancyId): boolean;
  computeEdgeKeysFromNodeIds(nodeIds: ReadonlySet<NodeId>): Set<EdgeKey>;
}
