export type ZoomLevel = 0.1246 | 0.2109 | 0.3835 | 0.5;

export interface SpriteCoords {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SpriteSheet {
  zoom: ZoomLevel; // from imageZoomLevels[i]
  filename: string; // relative to imageRoot
  coords: Record<string, SpriteCoords>; // key: node.icon path
}

export interface SpriteCategory {
  [zoom: number]: SpriteSheet;
}

export type SpriteCategoryName =
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

export type SpriteIndex = Record<SpriteCategoryName, SpriteCategory>;

export interface PassiveTreeRenderAssets {
  zoomLevels: ZoomLevel[];
  sprites: SpriteIndex;
}
