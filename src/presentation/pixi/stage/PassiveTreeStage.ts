import type { HoverPreviewState } from "@/domain/build/models/allocation/HoverPreviewState";
import type { PassiveTreeRenderAssets } from "@/domain/graph/PassiveTreeRenderAssets";
import { Stats } from "pixi-stats";
import { Viewport } from "pixi-viewport";
import { Application, Container } from "pixi.js";
import type {
  TreeRendererCallbacks,
  TreeSceneRenderModel,
  TreeVisualStateModel,
} from "../models/Render";
import { PassiveTreeAssetStore } from "../PassiveTreeAssetStore";
import { PassiveTreeRenderer } from "./PassiveTreeRenderer";

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
    eventMode: "passive",
    interactiveChildren: true,
  });
  private overlayLayer = new Container({
    label: "overlayLayer",
  });

  private groupBackgroundLayer = new Container({
    label: "groupBackgroundLayer",
  });

  private viewport: Viewport | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private renderer: PassiveTreeRenderer | null = null;

  private fitScale: number = 1;

  public async mount(
    host: HTMLElement,
    renderAssets: PassiveTreeRenderAssets,
    callbacks: TreeRendererCallbacks,
    options: PassiveTreeStageOptions = {},
  ): Promise<void> {
    if (this.app) return;

    this.host = host;

    callbacks.onReadyStateChange?.("mounting");

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

    this.viewport.drag().pinch().wheel().decelerate();

    this.resizeObserver = new ResizeObserver(() => {
      this.viewport?.resize(host.clientWidth, host.clientHeight);
    });
    this.resizeObserver.observe(host);

    this.world.addChild(
      this.backgroundLayer,
      this.groupBackgroundLayer,
      this.edgeLayer,
      this.nodeLayer,
      this.overlayLayer,
    );

    this.viewport.addChild(this.world);
    this.app.stage.addChild(this.viewport);
    this.host.appendChild(app.canvas);

    const assetStore = new PassiveTreeAssetStore(renderAssets);
    this.renderer = new PassiveTreeRenderer({
      backgroundLayer: this.backgroundLayer,
      edgeLayer: this.edgeLayer,
      nodeLayer: this.nodeLayer,
      overlayLayer: this.overlayLayer,
      groupBackgroundLayer: this.groupBackgroundLayer,
      callbacks,
      assetStore,
      viewport: this.viewport,
    });

    callbacks.onReadyStateChange?.("skeleton");

    await assetStore.loadHighestResolutionSheets();

    callbacks.onReadyStateChange?.("ready");

    this.stats = new Stats(this.app.renderer, this.app.ticker);
    host.parentElement?.prepend(this.stats.domElement!);
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

  public fitToBounds(bounds: { minX: number; minY: number; maxX: number; maxY: number }): void {
    if (!this.viewport || !this.app) return;

    const PADDING = 10;

    const treeWidth = bounds.maxX - bounds.minX;
    const treeHeight = bounds.maxY - bounds.minY;
    if (treeWidth <= 0 || treeHeight <= 0) return;

    const screenWidth = this.app.renderer.width;
    const screenHeight = this.app.renderer.height;

    // 1. Compute the scale that fits the tree into the screen with padding
    const fitScale = Math.min(
      (screenWidth - PADDING * 2) / treeWidth,
      (screenHeight - PADDING * 2) / treeHeight,
    );

    // 2. set world dimensions on the viewport so clampZoom has a reference.
    this.viewport.worldWidth = treeWidth;
    this.viewport.worldHeight = treeHeight;

    // 3. Update clampZoom bounds relative to the fit scale.
    this.viewport.clampZoom({
      minScale: fitScale * 0.9,
      maxScale: fitScale * 5,
    });

    this.viewport.scale.set(fitScale);

    // 5. Position viewport so the tree center is in the screen center.
    const treeCenterX = bounds.minX + treeWidth / 2;
    const treeCenterY = bounds.minY + treeHeight / 2;

    this.viewport.position.set(
      screenWidth / 2 - treeCenterX * fitScale,
      screenHeight / 2 - treeCenterY * fitScale,
    );

    this.fitScale = fitScale;

    // 6. world stays at scale(1) and position(0,0) — never touch it again
    this.world.scale.set(1);
    this.world.position.set(0);
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
