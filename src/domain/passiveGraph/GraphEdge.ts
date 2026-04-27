import type { NodeId } from "./PassiveNode";

export type EdgeKey = string;

export interface GraphEdge {
  key: EdgeKey;
  source: NodeId;
  target: NodeId;
  isAscendancyTransition: boolean;
  isMasteryLink: boolean;
  isProxyTransition: boolean;
}
