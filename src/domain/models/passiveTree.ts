import type { ClassId, PassiveClass } from "./passiveClass";
import type { GroupId, PassiveGroup } from "./passiveGroup";
import type { NodeId, PassiveNode, PassiveRootNode } from "./passiveNode";

export type PassiveTreeAdjacency = ReadonlyMap<NodeId, Set<NodeId>>;

export type PassiveTreeNodesById = ReadonlyMap<NodeId, PassiveNode>;

export interface PassiveTreeBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface PassiveTree {
  nodesById: PassiveTreeNodesById;
  groups: ReadonlyMap<GroupId, PassiveGroup>;
  classes: ReadonlyMap<ClassId, PassiveClass>;
  adjacency: {
    full: PassiveTreeAdjacency;
    main: PassiveTreeAdjacency;
    ascendancy: PassiveTreeAdjacency;
  };
  root: PassiveRootNode;
  bounds: PassiveTreeBounds;
}
