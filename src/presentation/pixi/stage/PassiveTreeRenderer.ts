import type { HoverPreviewState } from "@/domain/build/models/allocation/HoverPreviewState";
import type { EdgeKey } from "@/domain/graph/GraphEdge";
import type { NodeId } from "@/domain/graph/PassiveNode";
import { Container, Graphics } from "pixi.js";
import type { EdgeRenderModel, EdgeView } from "../models/Edge";
import type { NodeRenderModel } from "../models/Node";
import type {
  GroupBackgroundRenderModel,
  TreeRendererCallbacks,
  TreeSceneRenderModel,
  TreeVisualStateModel,
} from "../models/Render";
import { createEdgeView } from "../views/edge.view";
import type { PassiveTreeAssetStore } from "../PassiveTreeAssetStore";
import { NodeView } from "../views/NodeView";

export interface PassiveTreeRendererDeps {
  backgroundLayer: Container;
  edgeLayer: Container;
  nodeLayer: Container;
  overlayLayer: Container;
  callbacks: TreeRendererCallbacks;
  assetStore: PassiveTreeAssetStore;
}

export class PassiveTreeRenderer {
  private readonly backgroundLayer: Container;
  private readonly edgeLayer: Container;
  private readonly nodeLayer: Container;
  private readonly overlayLayer: Container;
  private readonly callbacks: TreeRendererCallbacks;
  private readonly assetStore: PassiveTreeAssetStore;

  private nodeViews = new Map<NodeId, NodeView>();
  private edgeViews = new Map<EdgeKey, EdgeView>();
  private backgroundViews = new Map<string, Graphics>();

  constructor(deps: PassiveTreeRendererDeps) {
    this.backgroundLayer = deps.backgroundLayer;
    this.edgeLayer = deps.edgeLayer;
    this.nodeLayer = deps.nodeLayer;
    this.overlayLayer = deps.overlayLayer;
    this.callbacks = deps.callbacks;
    this.assetStore = deps.assetStore;
  }

  public render(scene: TreeSceneRenderModel): void {
    this.renderBackgrounds(scene.backgrounds);
    this.renderEdges(scene.edges);
    this.renderNodes(scene.nodes);
    // this.renderOverlays(scene);
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

  private renderEdges(edges: EdgeRenderModel[]): void {
    for (const graphics of this.edgeViews.values()) {
      graphics.destroy();
    }

    this.edgeViews.clear();
    this.edgeLayer.removeChildren();

    for (const edge of edges) {
      const view = createEdgeView(edge);

      if (!view) continue;
      this.edgeViews.set(edge.key, view);
      this.edgeLayer.addChild(view.graphics);
    }
  }

  private renderNodes(nodes: NodeRenderModel[]): void {
    for (const view of this.nodeViews.values()) {
      view.destroy();
    }

    this.nodeViews.clear();
    this.nodeLayer.removeChildren();

    for (const node of nodes) {
      const view = new NodeView(node, this.assetStore, {
        onClick: this.callbacks.onNodeClick,
        onHover: this.callbacks.onNodeHover,
      });

      this.nodeViews.set(node.id, view);
      this.nodeLayer.addChild(view.container);
    }
  }

  // private renderOverlays(scene: TreeSceneRenderModel): void {
  //   this.overlayLayer.removeChildren();
  //
  //   if (!scene.highlightedPath.length) return;
  //
  //   const graphics = new Graphics();
  //
  //   graphics.moveTo(scene.highlightedPath[0]!.x, scene.highlightedPath[0]!.y);
  //
  //   for (let i = 1; i < scene.highlightedPath.length; i += 1) {
  //     const point = scene.highlightedPath[i]!;
  //     graphics.lineTo(point.x, point.y);
  //   }
  //
  //   graphics.stroke({ color: 0xffd166, width: 6, alpha: 0.85 });
  //
  //   this.overlayLayer.addChild(graphics);
  // }

  private createBackgroundView(background: GroupBackgroundRenderModel): Graphics {
    const graphics = new Graphics();

    graphics.circle(background.x, background.y, background.radius);
    graphics.fill({ color: background.color, alpha: background.alpha });

    return graphics;
  }

  public destroy(): void {
    for (const view of this.nodeViews.values()) {
      view.destroy();
    }

    this.nodeViews.clear();

    for (const graphics of this.edgeViews.values()) {
      graphics.destroy();
    }

    this.edgeViews.clear();

    for (const graphics of this.backgroundViews.values()) {
      graphics.destroy();
    }

    this.backgroundViews.clear();

    this.backgroundLayer.removeChildren();
    this.edgeLayer.removeChildren();
    this.nodeLayer.removeChildren();
    this.overlayLayer.removeChildren();
  }

  public updateNodeStates(state: TreeVisualStateModel): void {
    for (const [nodeId, view] of this.nodeViews) {
      view.updateBuildState({
        isAllocated: state.allocated.nodeIds.has(nodeId),
        isActiveClassStart: state.activeStartNodeIds.has(nodeId),
      });
    }
  }

  public updateEdgeStates(state: TreeVisualStateModel): void {
    for (const [edgeKey, view] of this.edgeViews) {
      view.updateBuildState({
        isActive: state.allocated.edgeKeys.has(edgeKey),
      });
    }
  }

  public updateHoverState({
    current,
    previous,
  }: {
    current: HoverPreviewState;
    previous: HoverPreviewState;
  }): void {
    const changedNodeIds = new Set<NodeId>(
      [
        previous.hoveredNodeId,
        current.hoveredNodeId,
        ...previous.highlight.nodeIds,
        ...current.highlight.nodeIds,
        ...previous.refund.nodeIds,
        ...current.refund.nodeIds,
      ].filter(Boolean) as NodeId[],
    );

    for (const nodeId of changedNodeIds) {
      this.nodeViews.get(nodeId)?.updateHoverState({
        isHovered: current.hoveredNodeId === nodeId,
        isInPreviewPath: current.highlight.nodeIds.has(nodeId),
        isInRefundPath: current.refund.nodeIds.has(nodeId),
      });
    }

    const changedEdgeKeys = new Set<EdgeKey>([
      ...previous.highlight.edgeKeys,
      ...current.highlight.edgeKeys,
      ...previous.refund.edgeKeys,
      ...current.refund.edgeKeys,
    ]);

    for (const edgeKey of changedEdgeKeys) {
      this.edgeViews.get(edgeKey)?.updateHoverState({
        isHighlighted: current.highlight.edgeKeys.has(edgeKey),
        isInRefundPath: current.refund.edgeKeys.has(edgeKey),
      });
    }
  }
}
