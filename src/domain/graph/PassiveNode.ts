import type { ClassId } from "./PassiveClass";
import type { GroupId } from "./PassiveGroup";

//TODO: change to number
export type NodeId = string;

export type AscendancySubregion = string;
export type PassiveNodeRegion = "main" | "ascendancy";
export type PassiveNodeSubregion = string | null;

export interface PassiveRootNode {
  // only for the very specifics rawjson.nodes['root'], it only has that
  groupId?: GroupId;
  orbit: number;
  /** Position index within the orbit (0..skillsPerOrbit[o]). */
  orbitIndex: number;
  out: NodeId[];
  in: NodeId[];
}

export interface PassiveNodeCommon extends PassiveRootNode {
  id: NodeId;
  name: string;
  stats: string[];
  icon: string;
  position?: PassiveNodePosition;
  ascendancyName?: string;
}

export type PassiveNormalNode = PassiveNodeCommon & {
  kind: "normal";
};

export type PassiveJewelNode = PassiveNodeCommon & {
  kind: "jewel";
};

export type PassiveNotableNode = PassiveNodeCommon & {
  kind: "notable";
};

export type PassiveClassStartNode = PassiveNodeCommon & {
  kind: "classStart";
  classStartIndex: ClassId;
};

export type PassiveProxyNode = PassiveNodeCommon & {
  kind: "proxy";
};

export type PassiveAscendancyStartNode = PassiveNodeCommon & {
  kind: "ascendancyStart";
  ascendancyName: string;
};

export type PassiveKeystoneNode = PassiveNodeCommon & {
  kind: "keystone";
};

export type PassiveMultipleChoiceNode = PassiveNodeCommon & {
  kind: "multipleChoice";
};

export type PassiveMultipleChoiceOptionNode = PassiveNodeCommon & {
  kind: "multipleChoiceOption";
};

export type PassiveMasteryNode = PassiveNodeCommon & {
  kind: "mastery";
  activeIcon: string;
  inactiveIcon: string;
  activeEffectImage: string;
  // mastery Effects ...
};

export type PassiveNode =
  | PassiveKeystoneNode
  | PassiveMasteryNode
  | PassiveAscendancyStartNode
  | PassiveProxyNode
  | PassiveClassStartNode
  | PassiveNormalNode
  | PassiveJewelNode
  | PassiveNotableNode
  | PassiveMultipleChoiceNode
  | PassiveMultipleChoiceOptionNode;

export type PassiveNodeKind = PassiveNode["kind"];
export interface PassiveNodePosition {
  x: number;
  y: number;
}
