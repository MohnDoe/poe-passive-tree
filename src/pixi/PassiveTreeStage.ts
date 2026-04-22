import { Viewport } from "pixi-viewport";
import { Application, Container } from "pixi.js";
import { PassiveTreeRenderer } from "./PassiveTreeRenderer";
import type { TreeSceneRenderModel } from "./types/render.models";
import type { TreeRendererCallbacks } from "./types/render.views";

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
  private linkLayer = new Container({
    label: "linkLayer",
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
    callbacks: TreeRendererCallbacks,
    options: PassiveTreeStageOptions = {},
  ): Promise<void> {
    if (this.app) return;

    this.host = host;

    const app = new Application();

    await app.init({
      resizeTo: host,
      backgroundColor: options.backgroundColor ?? 0x0b0d12,
      antialias: options.antialias ?? true,
      autoDensity: true,
    });

    this.app = app;

    this.viewport = new Viewport({
      events: this.app.renderer.events,
    });

    this.viewport.drag().pinch().wheel().decelerate();

    this.host.appendChild(app.canvas);

    this.world.addChild(this.backgroundLayer, this.linkLayer, this.nodeLayer, this.overlayLayer);

    this.viewport.addChild(this.world);
    this.app.stage.addChild(this.viewport);

    this.renderer = new PassiveTreeRenderer({
      backgroundLayer: this.backgroundLayer,
      linkLayer: this.linkLayer,
      nodeLayer: this.nodeLayer,
      overlayLayer: this.overlayLayer,
      callbacks,
    });
  }

  public render(scene: TreeSceneRenderModel): void {
    if (!this.renderer) return;
    this.renderer.render(scene);
  }

  public updateNodeStates(scene: TreeSceneRenderModel): void {
    if (!this.renderer) return;
    this.renderer.updateNodeStates(scene.nodes);
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
