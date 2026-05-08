import type { HoverPreviewState } from "@/domain/build/models/allocation/HoverPreviewState";
import type { PassiveTreeRenderAssets, ZoomLevel } from "@/domain/graph/PassiveTreeRenderAssets";
import { Viewport } from "pixi-viewport";
import { Application, Container } from "pixi.js";
import type {
  TreeRendererCallbacks,
  TreeSceneRenderModel,
  TreeVisualStateModel,
} from "../models/Render";
import { PassiveTreeAssetStore, snapZoomLevel } from "../PassiveTreeAssetStore";
import { PassiveTreeRenderer } from "./PassiveTreeRenderer";
import { Stats } from "pixi-stats";

const VIEWPORT_ZOOM_MIN = 0.5; // can zoom out a bit from initial fit
const VIEWPORT_ZOOM_MAX = 10; // can zoom into individual nodes clearly

export interface PassiveTreeStageOptions {
  backgroundColor?: number;
  antialias?: boolean;
}

export class PassiveTreeStage {
  private app: Application | null = null;
  private host: HTMLElement | null = null;

  public stats?: Stats;

  private world = new Container({
    label: "world",
  });

  private backgroundLayer = new Container({
    label: "backgroundLayer",
  });
  private edgeLayer = new Container({
    label: "edgeLayer",
  });
  private nodeLayer = new Container({
    label: "nodeLayer",
  });
  private overlayLayer = new Container({
    label: "overlayLayer",
  });

  private viewport: Viewport | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private renderer: PassiveTreeRenderer | null = null;

  private zoomLevel: ZoomLevel = 0.1246;

  public async mount(
    host: HTMLElement,
    renderAssets: PassiveTreeRenderAssets,
    callbacks: TreeRendererCallbacks,
    options: PassiveTreeStageOptions = {},
  ): Promise<void> {
    if (this.app) return;

    this.host = host;

    const app = new Application();

    await app.init({
      resizeTo: host,
      backgroundColor: options.backgroundColor ?? 0x080c11,
      antialias: options.antialias ?? true,
      autoDensity: true,
    });

    this.app = app;

    this.viewport = new Viewport({
      events: this.app.renderer.events,
      screenHeight: host.clientHeight,
      screenWidth: host.clientWidth,
    });

    this.viewport.drag().pinch().wheel().decelerate().clampZoom({
      minScale: VIEWPORT_ZOOM_MIN,
      maxScale: VIEWPORT_ZOOM_MAX,
    });

    this.resizeObserver = new ResizeObserver(() => {
      this.viewport?.resize(host.clientWidth, host.clientHeight);
    });

    this.resizeObserver.observe(host);

    this.zoomLevel = snapZoomLevel(this.getEffectiveZoom(this.viewport), renderAssets.zoomLevels);

    this.viewport.on("zoomed", ({ viewport }) => {
      const effectiveZoom = this.getEffectiveZoom(viewport);

      const next = snapZoomLevel(effectiveZoom, renderAssets.zoomLevels);
      if (next === this.zoomLevel) {
        this.zoomLevel = next;
        this.updateZoomLevel(this.zoomLevel);
      }
    });

    this.host.appendChild(app.canvas);

    this.world.addChild(this.backgroundLayer, this.edgeLayer, this.nodeLayer, this.overlayLayer);

    this.viewport.addChild(this.world);
    this.app.stage.addChild(this.viewport);

    const assetStore = new PassiveTreeAssetStore(renderAssets);
    await assetStore.preloadAll();

    this.renderer = new PassiveTreeRenderer({
      backgroundLayer: this.backgroundLayer,
      edgeLayer: this.edgeLayer,
      nodeLayer: this.nodeLayer,
      overlayLayer: this.overlayLayer,
      callbacks,
      assetStore,
    });

    this.stats = new Stats(this.app.renderer, this.app.ticker);
    host.parentElement?.prepend(this.stats.domElement!);

    // debug
    // @ts-expect-error has to be any
    globalThis.__PIXI_APP__ = this.app;
    // @ts-expect-error has to be any
    globalThis.__PIXI_STAGE__ = this.app.stage;
    // @ts-expect-error has to be any
    globalThis.__PIXI_RENDERED__ = this.renderer;
  }

  public render(scene: TreeSceneRenderModel): void {
    if (!this.renderer) return;
    this.renderer.render(scene);
  }

  public renderStaticScene(scene: TreeSceneRenderModel): void {
    this.render(scene);
  }

  public updateZoomLevel(zl: ZoomLevel): void {
    if (!this.renderer) return;
    this.renderer.updateZoomLevel(zl);
  }

  public updateVisualStates(state: TreeVisualStateModel): void {
    this.updateNodeStates(state);
    this.updateEdgeStates(state);
    // TODO: update other stuff
  }

  public updateNodeStates(state: TreeVisualStateModel): void {
    if (!this.renderer) return;
    this.renderer.updateNodeStates(state);
  }

  public updateEdgeStates(state: TreeVisualStateModel): void {
    if (!this.renderer) return;
    this.renderer.updateEdgeStates(state);
  }

  public updateHoverState({
    current,
    previous,
  }: {
    current: HoverPreviewState;
    previous: HoverPreviewState;
  }): void {
    if (!this.renderer) return;
    this.renderer.updateHoverState({ current, previous });
  }

  private getEffectiveZoom(viewport?: Viewport): number {
    const viewportScale = viewport?.scale.x ?? 1;
    return (viewportScale - VIEWPORT_ZOOM_MIN) / (VIEWPORT_ZOOM_MAX - VIEWPORT_ZOOM_MIN);
  }

  public fitToBounds(bounds: { minX: number; minY: number; maxX: number; maxY: number }): void {
    if (!this.app) return;

    const viewWidth = this.app.renderer.width;
    const viewHeight = this.app.renderer.height;

    const treeWidth = bounds.maxX - bounds.minX;
    const treeHeight = bounds.maxY - bounds.minY;

    if (treeWidth <= 0 || treeHeight <= 0) return;

    const padding = 10;
    const scaleX = (viewWidth - padding * 2) / treeWidth;
    const scaleY = (viewHeight - padding * 2) / treeHeight;
    const scale = Math.min(scaleX, scaleY);

    this.world.scale.set(scale);

    const scaledTreeWidth = treeWidth * scale;
    const scaledTreeHeight = treeHeight * scale;

    const offsetX = (viewWidth - scaledTreeWidth) / 2 - bounds.minX * scale;
    const offsetY = (viewHeight - scaledTreeHeight) / 2 - bounds.minY * scale;

    this.world.position.set(offsetX, offsetY);
  }

  public getCanvas(): HTMLCanvasElement | null {
    return this.app?.canvas ?? null;
  }

  public getWorld(): Container {
    return this.world;
  }

  public destroy(): void {
    this.renderer?.destroy();
    this.renderer = null;
    this.stats?.domElement?.remove();

    this.resizeObserver?.disconnect();

    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }

    this.host = null;
  }
}
