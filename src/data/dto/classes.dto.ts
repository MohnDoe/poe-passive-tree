export interface PassiveTreeClassDto {
  name: string;

  /** Base attributes for the class. */
  base_str: number;
  base_dex: number;
  base_int: number;

  /** Ascendancy classes for this base class. */
  ascendancies: PassiveTreeAscendancyDto[];
}

export interface PassiveTreeAscendancyDto {
  /** Internal id used in the ascendancy/tree data, e.g. 'Juggernaut'. */
  id: string;

  name: string;

  flavourText?: string;
  flavourTextColour?: string;
  flavourTextRect?: PassiveTreeRectDto;
}

export interface PassiveTreeRectDto {
  x: number;
  y: number;
  width: number;
  height: number;
}
