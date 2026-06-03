import type { AscendancyId } from "./PassiveAscendancy";
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

export interface PassiveNodePosition {
  x: number;
  y: number;
}

/** Common properties shared by all passive node variants. */
interface PassiveNodeBase {
  id: NodeId;
  name: string;
  stats: string[];
  orbit: number;
  orbitIndex: number;
  out: NodeId[];
  in: NodeId[];
  kind: PassiveNodeKind;
  position?: PassiveNodePosition;
  groupId?: GroupId;
}

export interface PassiveNormalNode extends PassiveNodeBase {
  kind: "normal";
  ascendancyName?: AscendancyId;
  reminderText?: string[];
  grantedStrength?: number;
  grantedDexterity?: number;
  grantedIntelligence?: number;
  grantedPassivePoints?: number;
  isMultipleChoiceOption?: boolean;
}

export interface PassiveNotableNode extends PassiveNodeBase {
  kind: "notable";
  ascendancyName?: AscendancyId;
  reminderText?: string[];
  isBlighted?: boolean;
  recipe?: number[];
  grantedStrength?: number;
  grantedDexterity?: number;
  grantedIntelligence?: number;
  grantedPassivePoints?: number;
  isMultipleChoice?: boolean;
}

export interface PassiveKeystoneNode extends PassiveNodeBase {
  kind: "keystone";
  isBlighted?: boolean;
  recipe?: number[];
  flavourText?: string[];
  reminderText?: string[];
}

export interface PassiveJewelSocketNode extends PassiveNodeBase {
  kind: "jewel";
  ascendancyName?: AscendancyId;
  expansionJewel?: PassiveExpansionJewel;
}

/** Domain-level representation of an expansion jewel socket. */
export interface PassiveExpansionJewel {
  /** Jewel size (0: small, 1: medium, etc. in GGG exports). */
  size: number;
  index: number;
  proxy: NodeId;
  parent: NodeId;
}

export interface PassiveMasteryNode extends PassiveNodeBase {
  kind: "mastery";
  // 313/351 mastery nodes have activeIcon/inactiveIcon/activeEffectImage/masteryEffects.
  // The other 38 are "base" mastery nodes — disconnected organizational anchors in the
  // tree. They have no graph edges and no effects.
  // All 4 properties are optional to accommodate both variants.
  activeIcon?: string;
  inactiveIcon?: string;
  activeEffectImage?: string;
  masteryEffects?: unknown;
}

export interface PassiveProxyNode extends PassiveNodeBase {
  kind: "proxy";
}

export interface PassiveClassStartNode extends PassiveNodeBase {
  kind: "classStart";
  classStartIndex: ClassId;
}

export interface PassiveAscendancyStartNode extends PassiveNodeBase {
  kind: "ascendancyStart";
  ascendancyName?: AscendancyId;
}

/** Discriminated union of all passive node variants. */
export type PassiveNode =
  | PassiveNormalNode
  | PassiveNotableNode
  | PassiveKeystoneNode
  | PassiveJewelSocketNode
  | PassiveMasteryNode
  | PassiveProxyNode
  | PassiveClassStartNode
  | PassiveAscendancyStartNode;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace PassiveNode {
  /** Type guard for normal nodes. */
  export function isNormal(node: PassiveNode): node is PassiveNormalNode {
    return node.kind === "normal";
  }

  /** Type guard for notable nodes. */
  export function isNotable(node: PassiveNode): node is PassiveNotableNode {
    return node.kind === "notable";
  }

  /** Type guard for keystone nodes. */
  export function isKeystone(node: PassiveNode): node is PassiveKeystoneNode {
    return node.kind === "keystone";
  }

  /** Type guard for jewel socket nodes. */
  export function isJewelSocket(node: PassiveNode): node is PassiveJewelSocketNode {
    return node.kind === "jewel";
  }

  /** Type guard for mastery nodes. */
  export function isMastery(node: PassiveNode): node is PassiveMasteryNode {
    return node.kind === "mastery";
  }

  /** Type guard for proxy nodes. */
  export function isProxy(node: PassiveNode): node is PassiveProxyNode {
    return node.kind === "proxy";
  }

  /** Type guard for class start nodes. */
  export function isClassStart(node: PassiveNode): node is PassiveClassStartNode {
    return node.kind === "classStart";
  }

  /** Type guard for ascendancy start nodes. */
  export function isAscendancyStart(node: PassiveNode): node is PassiveAscendancyStartNode {
    return node.kind === "ascendancyStart";
  }
}



