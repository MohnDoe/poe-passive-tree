import type { ClassId } from "./PassiveClass";
import type { GroupId } from "./PassiveGroup";

//TODO: change to number
export type NodeId = string;

export type AscendancySubregion = string;
export type PassiveNodeRegion = "main" | "ascendancy";
export type PassiveNodeSubregion = string | null;

export type PassiveNodeKind =
  | "normal"
  | "notable"
  | "keystone"
  | "jewel"
  | "mastery"
  | "proxy"
  | "classStart"
  | "ascendancyStart";

export interface PassiveRootNode {
  // only for the very specifics rawjson.nodes['root'], it only has that
  groupId?: GroupId;
  orbit: number;
  /** Position index within the orbit (0..skillsPerOrbit[o]). */
  orbitIndex: number;
  out: NodeId[];
  in: NodeId[];
}

export interface PassiveNode extends PassiveRootNode {
  id: NodeId;
  name: string;
  stats: string[];
  position?: PassiveNodePosition;
  kind: PassiveNodeKind;
  isMultipleChoice: boolean;
  isMultipleChoiceOption: boolean;
  ascendancyName?: string;
  classStartIndex?: ClassId;
}

export interface PassiveNodePosition {
  x: number;
  y: number;
}
