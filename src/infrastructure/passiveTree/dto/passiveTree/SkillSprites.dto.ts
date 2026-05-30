export interface PassiveTreeSpriteCoordDto {
  w: number;
  h: number;
  x: number;
  y: number;
}

export interface PassiveTreeSpriteSheetDto {
  filename: string;
  coords: Record<string, PassiveTreeSpriteCoordDto>;
}

export interface PassiveTreeSkillSpriteCategoryDto {
  [zoom: number]: PassiveTreeSpriteSheetDto;
}

export type PassiveTreeSkillSpriteCategoryName =
  | "background"
  | "normalActive"
  | "notableActive"
  | "keystoneActive"
  | "normalInactive"
  | "notableInactive"
  | "keystoneInactive"
  | "mastery"
  | "masteryConnected"
  | "masteryActiveSelected"
  | "masteryInactive"
  | "masteryActiveEffect"
  | "tattooActiveEffect"
  | "ascendancy"
  | "azmeriBloodline"
  | "trialmasterBloodline"
  | "oshabiBloodline"
  | "olrothBloodline"
  | "necromanticBloodline"
  | "lyciaBloodline"
  | "kingInTheMistsBloodline"
  | "farrulBloodline"
  | "deliriousBloodline"
  | "catarinaBloodline"
  | "breachlordBloodline"
  | "aulBloodline"
  | "startNode"
  | "groupBackground"
  | "frame"
  | "jewel"
  | "line"
  | "jewelRadius";

export type PassiveTreeSkillSpritesDto = Record<
  PassiveTreeSkillSpriteCategoryName,
  PassiveTreeSkillSpriteCategoryDto
>;
