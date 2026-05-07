import type {
  PassiveTreeRenderAssets,
  SpriteCategory,
  ZoomLevel,
} from "@/domain/graph/PassiveTreeRenderAssets";
import { Assets, Rectangle, Texture } from "pixi.js";
import type { NodeBuildState, NodeHoverState, NodeRenderModel } from "./models/Node";
import { resolveSpriteCategoryName } from "./theme/spriteCategory.resolver";

function nearestZoomLevel(target: number, available: ZoomLevel[]): ZoomLevel {
  return available.reduce((best, z) => (Math.abs(z - target) < Math.abs(best - target) ? z : best));
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
    build: NodeBuildState,
    hover: NodeHoverState,
    currentZoom: number,
  ): Texture {
    const categoryName = resolveSpriteCategoryName(model.kind, build, hover);

    const spriteCategoryIndex = this.renderAssets.sprites[categoryName] as SpriteCategory;

    const zoomLevel = nearestZoomLevel(
      currentZoom,
      Object.keys(spriteCategoryIndex).map((zoom) => Number(zoom) as ZoomLevel),
    );
    const cacheKey = `${model.id}|${categoryName}|${zoomLevel}`;
    const cached = this.textureCache.get(cacheKey);
    if (cached) return cached;

    const sheet = spriteCategoryIndex[zoomLevel];
    if (!sheet) return Texture.EMPTY;
    const coords = sheet.coords[model.icon];
    if (!coords) return Texture.EMPTY;

    const baseTexture = Assets.get(this.renderAssets.imageRoot + sheet.filename);

    console.log({
      categoryName,
      zoom: currentZoom,
      zoomLevel,
      baseTexture,
    });

    const tex = new Texture({
      source: baseTexture.source,
      frame: new Rectangle(coords.x, coords.y, coords.w, coords.h),
    });

    this.textureCache.set(cacheKey, tex);

    return tex;
  }
}
