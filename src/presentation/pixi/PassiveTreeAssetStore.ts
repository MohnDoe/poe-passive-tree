import type {
  PassiveTreeRenderAssets,
  SpriteCategory,
  SpriteCategoryName,
  SpriteSheet,
  ZoomLevel,
} from "@/domain/graph/PassiveTreeRenderAssets";
import { Assets, Rectangle, Texture } from "pixi.js";
import type { NodeRenderModel } from "./models/Node";

export function snapZoomLevel(target: number, available: ZoomLevel[]): ZoomLevel {
  return available.reduce((best, candidate) =>
    Math.abs(candidate - target) < Math.abs(best - target) ? candidate : best,
  );
}

export class PassiveTreeAssetStore {
  private textureCache = new Map<string, Texture>();

  constructor(private readonly renderAssets: PassiveTreeRenderAssets) {}

  // Pre-warms base textures for all sheets (call once on load)
  async preloadAll(): Promise<void> {
    const urls = new Set<string>();
    for (const [, sheets] of Object.entries(this.renderAssets.sprites)) {
      for (const [, sheet] of Object.entries(sheets)) {
        urls.add(this.renderAssets.imageRoot + sheet.filename);
      }
    }
    await Promise.all([...urls].map((url) => Assets.load(url)));
  }

  getNodeIconTexture(
    model: NodeRenderModel,
    categoryName: SpriteCategoryName,
    currentZoom: ZoomLevel,
  ): Texture {
    const categorySpriteSheetIndex = this.renderAssets.sprites[categoryName] as SpriteCategory;
    if (!categorySpriteSheetIndex) return Texture.EMPTY;

    const zoomLevel = snapZoomLevel(
      currentZoom,
      this.getSpriteSheetIndexAvailableZoomLevels(categorySpriteSheetIndex),
    );
    const cacheKey = `${model.id}|${categoryName}|${zoomLevel}`;
    const cached = this.getCachedTexture(cacheKey);
    if (cached) return cached;

    const sheet = categorySpriteSheetIndex[zoomLevel];
    if (!sheet) return Texture.EMPTY;

    const tex = this.getTextureFromSheet(sheet, model.icon);

    this.textureCache.set(cacheKey, tex);

    return tex;
  }

  getNodeFrameTexture(
    model: NodeRenderModel,
    frameCoordsKey: string,
    currentZoom: ZoomLevel,
  ): Texture {
    const frameSpriteSheetIndex = this.renderAssets.sprites["frame"];
    if (!frameSpriteSheetIndex) {
      console.error("Missing 'frame' spritesheet");
      return Texture.EMPTY;
    }

    const zoomLevel = snapZoomLevel(
      currentZoom,
      this.getSpriteSheetIndexAvailableZoomLevels(frameSpriteSheetIndex),
    );

    const cacheKey = `${model.kind}|frame|${zoomLevel}`;
    const cached = this.getCachedTexture(cacheKey);
    if (cached) return cached;

    const sheet = frameSpriteSheetIndex[zoomLevel];
    if (!sheet) return Texture.EMPTY;

    const tex = this.getTextureFromSheet(sheet, frameCoordsKey);

    this.textureCache.set(cacheKey, tex);

    return tex;
  }

  getTextureFromSheet(sheet: SpriteSheet, coordsKey: string): Texture {
    const coords = sheet.coords[coordsKey];
    if (!coords) return Texture.EMPTY;

    const baseTexture = Assets.get(this.renderAssets.imageRoot + sheet.filename);
    return new Texture({
      source: baseTexture.source,
      frame: new Rectangle(coords.x, coords.y, coords.w, coords.h),
    });
  }

  getCachedTexture(key: string): Texture | undefined {
    return this.textureCache.get(key);
  }

  getSpriteSheetIndexAvailableZoomLevels(category: SpriteCategory): ZoomLevel[] {
    return Object.keys(category).map((zoom) => Number(zoom) as ZoomLevel);
  }
}
