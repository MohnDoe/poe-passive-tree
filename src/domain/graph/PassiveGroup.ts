import type { NodeId } from "./PassiveNode";

export type GroupId = string;

export interface PassiveGroupBackground {
  image: string;
  isHalfImage: boolean;
}

export interface PassiveGroup {
  id: GroupId;
  x: number;
  y: number;
  nodeIds: NodeId[];
  background?: PassiveGroupBackground;
}
