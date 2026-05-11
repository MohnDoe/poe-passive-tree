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

export function getSpriteSheetIndexHighestZoomLevel(category: SpriteCategory): ZoomLevel {
  return Object.keys(category)
    .map(Number)
    .sort((a, b) => b - a)[0]! as ZoomLevel;
}

export class PassiveTreeAssetStore {
  private textureCache = new Map<string, Texture>();

  #circleContexts = new Map<number, GraphicsContext>();

  constructor(private readonly renderAssets: PassiveTreeRenderAssets) {
    this.#initCircleContexts();
  }

  async loadHighestResolutionSheets(): Promise<void> {
    const urls = new Set<string>();
    for (const sheets of Object.values(this.renderAssets.sprites)) {
      const highestZoomLevel = getSpriteSheetIndexHighestZoomLevel(sheets);
      const sheet = (sheets as SpriteCategory)[highestZoomLevel];
      if (sheet) urls.add(this.renderAssets.imageRoot + sheet.filename);
    }

    await Promise.all([...urls].map((url) => Assets.load(url)));
  }

  getTexture(categoryName: SpriteCategoryName, coords: string) {
    const categorySpriteSheetIndex = this.renderAssets.sprites[categoryName] as SpriteCategory;
    if (!categorySpriteSheetIndex) return Texture.EMPTY;

    const zoomLevel = getSpriteSheetIndexHighestZoomLevel(categorySpriteSheetIndex);

    const sheet = categorySpriteSheetIndex[zoomLevel];
    if (!sheet) return Texture.EMPTY;

    const tex = this.getTextureFromSheet(sheet, coords);

    return tex;
  }

  getNodeIconTexture(model: NodeRenderModel, categoryName: SpriteCategoryName): Texture {
    return this.getTexture(categoryName, model.icon);
  }

  getNodeFrameTexture(frameCoordsKey: string): Texture {
    return this.getTexture("frame", frameCoordsKey);
  }

  getGroupBackgroundTexture(coordsKey: string): Texture {
    return this.getTexture("groupBackground", coordsKey);
  }

  getTextureFromSheet(sheet: SpriteSheet, coordsKey: string): Texture {
    const cacheKey = `${sheet.filename}|${coordsKey}`;
    const cached = this.getCachedTexture(cacheKey);
    if (cached) {
      return cached;
    }

    const coords = sheet.coords[coordsKey];
    if (!coords) return Texture.EMPTY;

    const baseTexture = Assets.get(this.renderAssets.imageRoot + sheet.filename);

    if (!baseTexture) {
      console.error("Texture missing", this.renderAssets.imageRoot + sheet.filename);
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

  getCircleContext(size: number) {
    if (!this.#circleContexts.has(size)) {
      const radius = size / 2 - 2;
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
