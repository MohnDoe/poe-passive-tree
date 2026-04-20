import type { ClassId, PassiveClass } from "./passiveClass";
import type { GroupId, PassiveGroup } from "./passiveGroup";
import type { NodeId, PassiveNode, PassiveRootNode } from "./passiveNode";

export interface PassiveTree {
  nodes: ReadonlyMap<NodeId, PassiveNode>
  groups: ReadonlyMap<GroupId, PassiveGroup>
  classes: ReadonlyMap<ClassId, PassiveClass>
  adjacency: ReadonlyMap<NodeId, NodeId[]>
  root: PassiveRootNode
}
