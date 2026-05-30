export interface PassiveTreeGroupDto {
  x: number;
  y: number;

  /**
   * The orbits present in this group (0..4).
   * This is a normalised form of the wiki’s 'oo' boolean-or-assoc array.
   */
  orbits: number[];

  /**
   * Node ids that belong to this group.
   * In your JSON these are stored as strings (e.g. '5865').
   */
  nodes: string[];

  background?: PassiveTreeGroupBackgroundDto;
}

export type PassiveTreeJewelSlotsDto = number[];

export interface PassiveTreeGroupBackgroundDto {
  image: string;
  isHalfImage?: true;
}
