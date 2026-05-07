import type {
  PassiveTreeRenderAssets,
  SpriteCategory,
  SpriteCategoryName,
  SpriteIndex,
  ZoomLevel,
} from "@/domain/graph/PassiveTreeRenderAssets";
import type { PassiveTreeDto } from "../../dto/passiveTree/PassiveSkillTree.dto";

export function mapRenderAssetsFromJson(raw: PassiveTreeDto): PassiveTreeRenderAssets {
  const zoomLevels: number[] = [...raw.imageZoomLevels, 0.5];

  const sprites = {} as SpriteIndex;
  for (const [category, sheets] of Object.entries(raw.sprites)) {
    const spriteCategory: SpriteCategory = {};
    for (const [zoomLevel, sheet] of Object.entries(sheets)) {
      spriteCategory[Number(zoomLevel) as ZoomLevel] = {
        zoom: Number(zoomLevel) as ZoomLevel,
        filename: sheet.filename,
        coords: sheet.coords,
      };
    }
    sprites[category as SpriteCategoryName] = spriteCategory;
  }

  return { zoomLevels: zoomLevels as ZoomLevel[], sprites };
}
