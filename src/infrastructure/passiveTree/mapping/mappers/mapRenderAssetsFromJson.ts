import type {
  PassiveTreeRenderAssets,
  ZoomLevel,
  SpriteCategory,
  SpriteIndex,
} from "@/domain/graph/PassiveTreeRenderAssets";
import type { PassiveTreeDto } from "../../dto/passiveTree/PassiveSkillTree.dto";
import type { PassiveTreeSpriteSheetDto } from "../../dto/passiveTree/SkillSprites.dto";

export function mapRenderAssetsFromJson(raw: PassiveTreeDto): PassiveTreeRenderAssets {
  const zoomLevels: number[] = [...raw.imageZoomLevels, 0.5];

  const sprites = {} as SpriteIndex;
  for (const [category, sheets] of Object.entries(raw.sprites)) {
    sprites[category as SpriteCategory] = (
      Object.entries(sheets) as unknown as [number, PassiveTreeSpriteSheetDto][]
    ).map(([zoomLevel, sheet]) => ({
      zoom: Number(zoomLevel) as ZoomLevel,
      filename: sheet.filename,
      coords: sheet.coords,
    }));
  }

  return { zoomLevels: zoomLevels as ZoomLevel[], sprites };
}
