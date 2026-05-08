import type {
  PassiveTreeRenderAssets,
  SpriteCategory,
  SpriteCategoryName,
  SpriteSheet,
  ZoomLevel,
} from "@/domain/graph/PassiveTreeRenderAssets";
import { Assets, GraphicsContext, Rectangle, Texture } from "pixi.js";
import type { NodeRenderModel } from "./models/Node";
import { passiveTreeTheme } from "./theme/passiveTree.theme";

export function snapZoomLevel(target: number, available: ZoomLevel[]): ZoomLevel {
  return available.reduce((best, candidate) =>
    Math.abs(candidate - target) < Math.abs(best - target) ? candidate : best,
  );
}

export class PassiveTreeAssetStore {
  private textureCache = new Map<string, Texture>();

  #circleContexts = new Map<number, GraphicsContext>();
  #warmedZoomLevels = new Set<ZoomLevel>();

  constructor(private readonly renderAssets: PassiveTreeRenderAssets) {
    this.#initCircleContexts();
  }

  async preloadZoomLevel(zoomLevel: ZoomLevel): Promise<void> {
    if (this.#warmedZoomLevels.has(zoomLevel)) return;

    const urls = new Set<string>();
    for (const [, sheets] of Object.entries(this.renderAssets.sprites)) {
      const sheet = (sheets as SpriteCategory)[zoomLevel];
      if (sheet) urls.add(this.renderAssets.imageRoot + sheet.filename);
    }

    await Promise.all([...urls].map((url) => Assets.load(url)));
    this.#warmTextureCacheForZoom(zoomLevel);
  }

  preloadRemainingZoomLevels(alreadyLoaded: ZoomLevel): void {
    const remaining = this.renderAssets.zoomLevels.filter((z) => z !== alreadyLoaded);
    for (const zoomLevel of remaining) {
      // Stagger with a small delay so the main thread stays free during
      // the first render pass.
      setTimeout(() => {
        this.preloadZoomLevel(zoomLevel).catch(console.error);
      }, 200);
    }
  }

  #warmTextureCacheForZoom(zoomLevel: ZoomLevel): void {
    for (const [, sheets] of Object.entries(this.renderAssets.sprites)) {
      const sheet = (sheets as SpriteCategory)[zoomLevel];
      if (!sheet) continue;
      for (const coordsKey of Object.keys(sheet.coords)) {
        this.getTextureFromSheet(sheet, coordsKey); // populates textureCache
      }
    }
    this.#warmedZoomLevels.add(zoomLevel);
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

    const sheet = categorySpriteSheetIndex[zoomLevel];
    if (!sheet) return Texture.EMPTY;

    const tex = this.getTextureFromSheet(sheet, model.icon);

    return tex;
  }

  getNodeFrameTexture(frameCoordsKey: string, currentZoom: ZoomLevel): Texture {
    const frameSpriteSheetIndex = this.renderAssets.sprites["frame"];
    if (!frameSpriteSheetIndex) {
      console.error("Missing 'frame' spritesheet");
      return Texture.EMPTY;
    }

    const zoomLevel = snapZoomLevel(
      currentZoom,
      this.getSpriteSheetIndexAvailableZoomLevels(frameSpriteSheetIndex),
    );

    const sheet = frameSpriteSheetIndex[zoomLevel];
    if (!sheet) return Texture.EMPTY;

    const tex = this.getTextureFromSheet(sheet, frameCoordsKey);

    return tex;
  }

  getTextureFromSheet(sheet: SpriteSheet, coordsKey: string): Texture {
    const cacheKey = `${sheet.filename}|${coordsKey}`;
    const cached = this.getCachedTexture(cacheKey);
    if (cached) {
      return cached;
    }

    // console.warn("texture cache miss", cacheKey);

    const coords = sheet.coords[coordsKey];
    if (!coords) return Texture.EMPTY;

    const baseTexture = Assets.get(this.renderAssets.imageRoot + sheet.filename);

    if (!baseTexture) {
      // console.error("Texture missing", this.renderAssets.imageRoot + sheet.filename);
      return Texture.EMPTY;
    }

    const tex = new Texture({
      source: baseTexture.source,
      frame: new Rectangle(coords.x, coords.y, coords.w, coords.h),
    });

    this.textureCache.set(cacheKey, tex);
    return tex;
  }

  getCachedTexture(key: string): Texture | undefined {
    return this.textureCache.get(key);
  }

  getSpriteSheetIndexAvailableZoomLevels(category: SpriteCategory): ZoomLevel[] {
    return Object.keys(category).map((zoom) => Number(zoom) as ZoomLevel);
  }

  getCircleContext(size: number) {
    if (!this.#circleContexts.has(size)) {
      const radius = size / 2;
      const circleContext = new GraphicsContext().circle(0, 0, radius).fill(0xffffff);
      this.#circleContexts.set(size, circleContext);
      return circleContext;
    }
    return this.#circleContexts.get(size)!;
  }

  #initCircleContexts() {
    console.log("initializing circleContexts", Object.values(passiveTreeTheme.nodes.sizeByKind));
    for (const radius of Object.values(passiveTreeTheme.nodes.sizeByKind)) {
      this.getCircleContext(radius);
    }
  }
}
