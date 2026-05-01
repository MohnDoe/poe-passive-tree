import type { ClassId, PassiveClass } from "./PassiveClass";
import type { GroupId, PassiveGroup } from "./PassiveGroup";
import type { NodeId, PassiveNode } from "./PassiveNode";

export interface PassiveTreeBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface PassiveTreeData {
  nodesById: ReadonlyMap<NodeId, PassiveNode>;
  groupsById: ReadonlyMap<GroupId, PassiveGroup>;
  classesById: ReadonlyMap<ClassId, PassiveClass>;

  bounds: PassiveTreeBounds;
}
