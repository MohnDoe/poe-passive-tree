import type { NodeId } from "./passiveNode";

export type ClassId = string;

export interface PassiveClass {
  id: ClassId
  name: string
  startNodeIds: NodeId[]
}
