import type { ClassId } from "./passiveClass";
import type { GroupId } from "./passiveGroup";

export type NodeId = string;

export type AscendancySubregion = string;
export type PassiveNodeRegion = "main" | "ascendancy";
export type PassiveNodeKind =
  | "normal"
  | "notable"
  | "keystone"
  | "jewel"
  | "mastery"
  | "proxy"
  | "classStart"
  | "ascendancyStart";

export interface PassiveNodeNormalized {
  id: NodeId;
  name: string;
  stats: string[];
  groupId?: GroupId;
  position?: PassiveNodePosition;
  kind: PassiveNodeKind;
  orbit: number;
  orbitIndex: number;
  out: NodeId[];
  in: NodeId[];
  isMultipleChoice: boolean;
  isMultipleChoiceOption: boolean;
  ascendancyName?: string;
  classStartIndex?: ClassId;
}

export interface PassiveNode extends PassiveNodeNormalized {
  region: PassiveNodeRegion;
  subregion?: AscendancySubregion;
}

export interface PassiveRootNode {
  groupId: GroupId;
  orbit: number;
  /** Position index within the orbit (0..skillsPerOrbit[o]). */
  orbitIndex: number;
  out: NodeId[];
  in: NodeId[];
}

export interface PassiveNodePosition {
  x: number;
  y: number;
}
