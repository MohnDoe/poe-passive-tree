import type { NodeId } from "./passiveNode";

export type ClassId = number;

export interface PassiveClass {
  id: ClassId;
  name: string;
  startNodeIds: Set<NodeId>;
}
