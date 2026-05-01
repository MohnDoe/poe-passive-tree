export interface PassiveTreeNodeBaseDto {
  group?: number;
  /** Orbit index (0..4), corresponding to `constants.orbitRadii`. */
  orbit?: number;
  /** Position index within the orbit (0..skillsPerOrbit[o]). */
  orbitIndex?: number;
  out?: string[];
  in?: string[];
}

export interface PassiveTreeNodeDto extends PassiveTreeNodeBaseDto {
  /** Numeric node id (a.k.a. 'skill' / hash). */
  skill: number;

  name: string;

  icon: string;

  /**
   * Actual stat lines; one string per line (with escaped newlines when present).
   * */
  stats: string[];

  flavourText?: string[];
  reminderText?: string[];

  isNotable?: boolean;
  isKeystone?: boolean;
  isMastery?: boolean;
  isJewelSocket?: boolean;

  /** Extra metadata for jewel sockets (expansion jewels). */
  expansionJewel?: PassiveTreeExpansionJewelDto;

  isAscendancyStart?: boolean;

  ascendancyName?: string;

  grantedStrength?: number;

  grantedDexterity?: number;

  grantedIntelligence?: number;

  grantedPassivePoints?: number;

  isMultipleChoice?: boolean;

  isMultipleChoiceOption?: boolean;

  isProxy?: boolean;

  isBlighted?: boolean;

  classStartIndex?: number;

  recipe?: number[];

  [key: string]: unknown;
}

export type PassiveTreeRootNodeDto = PassiveTreeNodeBaseDto;

export type PassiveTreeNodeEntryDto = PassiveTreeNodeDto | PassiveTreeRootNodeDto;

export interface PassiveTreeExpansionJewelDto {
  /** Jewel size (0: small, 1: medium, etc. in GGG exports). */
  size: number;

  index: number;

  proxy: string;

  parent: string;
}

export const ROOT_NODE_ID = "root" as const;

export function isPassiveNode(
  node: PassiveTreeNodeEntryDto | undefined,
): node is PassiveTreeNodeDto {
  return !!node && typeof (node as PassiveTreeNodeDto).skill === "number";
}

export function isRootNodeId(id: string): id is typeof ROOT_NODE_ID {
  return id === ROOT_NODE_ID;
}
