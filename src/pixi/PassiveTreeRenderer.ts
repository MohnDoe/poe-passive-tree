import { Container, Graphics } from "pixi.js";
import type { NodeId } from "@/domain/models/passiveNode";
import type {
  GroupBackgroundRenderModel,
  LinkRenderModel,
  NodeRenderModel,
  TreeSceneRenderModel,
} from "./types/render.models";
import { createNodeView } from "./views/node.view";
import { createLinkView } from "./views/link.view";
import type { TreeRendererCallbacks, NodeView } from "./types/render.views";

export interface PassiveTreeRendererDeps {
  backgroundLayer: Container;
  linkLayer: Container;
  nodeLayer: Container;
  overlayLayer: Container;
  callbacks: TreeRendererCallbacks;
}

export class PassiveTreeRenderer {
  private readonly backgroundLayer: Container;
  private readonly linkLayer: Container;
  private readonly nodeLayer: Container;
  private readonly overlayLayer: Container;
  private readonly callbacks: TreeRendererCallbacks;

  private nodeViews = new Map<NodeId, NodeView>();
  private linkViews = new Map<string, Graphics>();
  private backgroundViews = new Map<string, Graphics>();

  constructor(deps: PassiveTreeRendererDeps) {
    this.backgroundLayer = deps.backgroundLayer;
    this.linkLayer = deps.linkLayer;
    this.nodeLayer = deps.nodeLayer;
    this.overlayLayer = deps.overlayLayer;
    this.callbacks = deps.callbacks;
  }

  public render(scene: TreeSceneRenderModel): void {
    this.renderBackgrounds(scene.backgrounds);
    this.renderLinks(scene.links);
    this.renderNodes(scene.nodes);
    this.renderOverlays(scene);
  }

  public updateNodeStates(nodes: NodeRenderModel[]): void {
    for (const node of nodes) {
      const view = this.nodeViews.get(node.id);

      if (!view) continue;

      view.redraw(node);
    }
  }

  public destroy(): void {
    for (const view of this.nodeViews.values()) {
      view.destroy();
    }

    this.nodeViews.clear();

    for (const graphics of this.linkViews.values()) {
      graphics.destroy();
    }

    this.linkViews.clear();

    for (const graphics of this.backgroundViews.values()) {
      graphics.destroy();
    }

    this.backgroundViews.clear();

    this.backgroundLayer.removeChildren();
    this.linkLayer.removeChildren();
    this.nodeLayer.removeChildren();
    this.overlayLayer.removeChildren();
  }

  private renderBackgrounds(backgrounds: GroupBackgroundRenderModel[]): void {
    for (const graphics of this.backgroundViews.values()) {
      graphics.destroy();
    }

    this.backgroundViews.clear();
    this.backgroundLayer.removeChildren();

    for (const background of backgrounds) {
      const view = this.createBackgroundView(background);

      this.backgroundViews.set(background.key, view);
      this.backgroundLayer.addChild(view);
    }
  }

  private renderLinks(links: LinkRenderModel[]): void {
    for (const graphics of this.linkViews.values()) {
      graphics.destroy();
    }

    this.linkViews.clear();
    this.linkLayer.removeChildren();

    for (const link of links) {
      const view = createLinkView(link);

      this.linkViews.set(link.key, view);
      this.linkLayer.addChild(view);
    }
  }

  private renderNodes(nodes: NodeRenderModel[]): void {
    for (const view of this.nodeViews.values()) {
      view.destroy();
    }

    this.nodeViews.clear();
    this.nodeLayer.removeChildren();

    for (const node of nodes) {
      const view = createNodeView(node, {
        onClick: this.callbacks.onNodeClick,
        onHover: this.callbacks.onNodeHover,
      });

      this.nodeViews.set(node.id, view);
      this.nodeLayer.addChild(view.container);
    }
  }

  private renderOverlays(scene: TreeSceneRenderModel): void {
    this.overlayLayer.removeChildren();

    if (!scene.highlightedPath.length) return;

    const graphics = new Graphics();

    graphics.moveTo(scene.highlightedPath[0]!.x, scene.highlightedPath[0]!.y);

    for (let i = 1; i < scene.highlightedPath.length; i += 1) {
      const point = scene.highlightedPath[i]!;
      graphics.lineTo(point.x, point.y);
    }

    graphics.stroke({ color: 0xffd166, width: 6, alpha: 0.85 });

    this.overlayLayer.addChild(graphics);
  }

  private createBackgroundView(background: GroupBackgroundRenderModel): Graphics {
    const graphics = new Graphics();

    graphics.circle(background.x, background.y, background.radius);
    graphics.fill({ color: background.color, alpha: background.alpha });

    return graphics;
  }
}
