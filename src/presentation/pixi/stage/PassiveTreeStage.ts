import type { HoverPreviewState } from "@/domain/build/models/allocation/HoverPreviewState";
import { Viewport } from "pixi-viewport";
import { Application, Container } from "pixi.js";
import type {
  TreeRendererCallbacks,
  TreeSceneRenderModel,
  TreeVisualStateModel,
} from "../models/Render";
import { PassiveTreeRenderer } from "./PassiveTreeRenderer";
import type { PassiveTreeRenderAssets } from "@/domain/graph/PassiveTreeRenderAssets";
import { PassiveTreeAssetStore } from "../assets";

export interface PassiveTreeStageOptions {
  backgroundColor?: number;
  antialias?: boolean;
}

export class PassiveTreeStage {
  private app: Application | null = null;
  private host: HTMLElement | null = null;

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
  private renderer: PassiveTreeRenderer | null = null;

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
    });

    this.viewport.drag().pinch().wheel().decelerate();

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

    // debug
    // globalThis.__PIXI_APP__ = this.app;
    // globalThis.__PIXI_STAGE__ = this.app.stage;
    // globalThis.__PIXI_RENDERED__ = this.renderer;
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

    if (this.app) {
      this.app.destroy(true, { children: true });
      this.app = null;
    }

    this.host = null;
  }
}
