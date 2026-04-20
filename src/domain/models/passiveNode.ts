import type { GroupId } from "./passiveGroup";

export type NodeId = string;

export interface PassiveNode {
  id: NodeId
  name: string
  stats: string[]
  groupId?: GroupId
  position?: PassiveNodePosition
  type: 'normal' | 'notable' | 'keystone' | 'jewel'
  outgoing: NodeId[]
}

export interface PassiveRootNode {
  groupId?: GroupId;
  orbit?: number;
  /** Position index within the orbit (0..skillsPerOrbit[o]). */
  orbitIndex?: number;
  out?: NodeId[];
  in?: NodeId[]

}

export interface PassiveNodePosition {
  x: number
  y: number
}
