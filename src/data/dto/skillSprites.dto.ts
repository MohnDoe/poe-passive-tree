export interface PassiveTreeSpriteCoordDto {
  w: number;
  h: number;
  x: number;
  y: number;
}

export interface PassiveTreeSpriteSheetDto {
  filename: string;

  /**
   * Map from icon path (same as `PassiveTreeNode.icon`) to sprite coordinates.
   */
  coords: Record<string, PassiveTreeSpriteCoordDto>;
}

export type PassiveTreeSkillSpriteCategoryDto = PassiveTreeSpriteSheetDto[];

export interface PassiveTreeSkillSpritesDto {
  keystoneActive?: PassiveTreeSkillSpriteCategoryDto;
  keystoneInactive?: PassiveTreeSkillSpriteCategoryDto;
  mastery?: PassiveTreeSkillSpriteCategoryDto;
  normalActive?: PassiveTreeSkillSpriteCategoryDto;
  normalInactive?: PassiveTreeSkillSpriteCategoryDto;
  notableActive?: PassiveTreeSkillSpriteCategoryDto;
  notableInactive?: PassiveTreeSkillSpriteCategoryDto;

  [key: string]: PassiveTreeSkillSpriteCategoryDto | undefined;
}
