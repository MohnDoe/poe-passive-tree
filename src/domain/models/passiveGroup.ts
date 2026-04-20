import type { NodeId } from "./passiveNode"

export type GroupId = string;

export interface PassiveGroup {
  id: GroupId
  x: number
  y: number
  nodeIds: NodeId[]
}
