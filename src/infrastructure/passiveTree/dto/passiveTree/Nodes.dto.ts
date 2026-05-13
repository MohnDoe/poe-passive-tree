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

  grantedStrength?: number;
  grantedDexterity?: number;
  grantedIntelligence?: number;
  grantedPassivePoints?: number;

  isMastery?: true;
  /** Only when isMastery: true */
  inactiveIcon?: string;
  activeIcon?: string;
  activeEffectImage?: string;

  isNotable?: true;
  isBlighted?: true;
  //* Present when isNotable or isBlighted */
  recipe?: string[];

  classStartIndex?: number;

  isAscendancyStart?: true;
  //** present when isAscendancyStart but sometimes present even when isAscendancyStart is false */
  ascendancyName?: string;

  isKeystone?: true;
  //** when isKeystone */
  flavourText?: string[];

  isMultipleChoice?: true;
  isMultipleChoiceOption?: true;
  //** present when isMultipleChoice/isMultipleChoiceOption and isKeystone
  reminderText?: string[];

  isProxy?: true;

  isJewelSocket?: true;
  //* present when isJewelSocket */
  expansionJewel?: PassiveTreeExpansionJewelDto;
}

export type PassiveTreeRootNodeDto = PassiveTreeNodeBaseDto;

export type PassiveTreeNodeEntryDto = PassiveTreeNodeDto | PassiveTreeRootNodeDto;

interface PassiveTreeExpansionJewelDto {
  /** Jewel size (0: small, 1: medium, etc. in GGG exports). */
  size: number;
  index: number;
  proxy: string;
  parent?: string;
}

export const ROOT_NODE_ID = "root" as const;
