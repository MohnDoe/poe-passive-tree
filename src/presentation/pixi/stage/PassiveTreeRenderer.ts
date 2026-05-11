import type { HoverPreviewState } from "@/domain/build/models/allocation/HoverPreviewState";
import type { EdgeKey } from "@/domain/graph/GraphEdge";
import type { NodeId } from "@/domain/graph/PassiveNode";
import { Container } from "pixi.js";
import type { EdgeRenderModel, EdgeView } from "../models/Edge";
import type { NodeRenderModel } from "../models/Node";
import type {
  GroupBackgroundRenderModel,
  TreeRendererCallbacks,
  TreeSceneRenderModel,
  TreeVisualStateModel,
} from "../models/Render";
import type { PassiveTreeAssetStore } from "../PassiveTreeAssetStore";
import { createEdgeView } from "../views/edge.view";
import { GroupBackgroundView } from "../views/GroupBackgroundView";
import { NodeView } from "../views/NodeView";
import type { Viewport } from "pixi-viewport";
import { passiveTreeTheme } from "../theme/passiveTree.theme";
import { computeEdgeBounds } from "../utils/edgeBounds";
import { CullingManager } from "./CullingManager";

export interface PassiveTreeRendererDeps {
  backgroundLayer: Container;
  edgeLayer: Container;
  nodeLayer: Container;
  overlayLayer: Container;
  groupBackgroundLayer: Container;
  callbacks: TreeRendererCallbacks;
  assetStore: PassiveTreeAssetStore;
  viewport: Viewport;
}

export class PassiveTreeRenderer {
  private readonly backgroundLayer: Container;
  private readonly edgeLayer: Container;
  private readonly nodeLayer: Container;
  private readonly overlayLayer: Container;
  private readonly groupBackgroundLayer: Container;
  private readonly callbacks: TreeRendererCallbacks;
  private readonly assetStore: PassiveTreeAssetStore;

  private nodeViews = new Map<NodeId, NodeView>();
  private edgeViews = new Map<EdgeKey, EdgeView>();
  private groupBackgroundViews = new Map<string, GroupBackgroundView>();

  private culling: CullingManager | null = null;
  private readonly viewport: Viewport;

  constructor(deps: PassiveTreeRendererDeps) {
    this.backgroundLayer = deps.backgroundLayer;
    this.edgeLayer = deps.edgeLayer;
    this.nodeLayer = deps.nodeLayer;
    this.overlayLayer = deps.overlayLayer;
    this.groupBackgroundLayer = deps.groupBackgroundLayer;

    this.callbacks = deps.callbacks;
    this.assetStore = deps.assetStore;
    this.viewport = deps.viewport;
  }

  public render(scene: TreeSceneRenderModel): void {
    this.renderGroupBackgrounds(scene.groupBackgrounds);
    this.renderEdges(scene.edges);
    this.renderNodes(scene.nodes);
    // this.renderOverlays(scene);

    this.#setupCulling(scene);
  }

  private renderGroupBackgrounds(backgrounds: GroupBackgroundRenderModel[]): void {
    for (const view of this.groupBackgroundViews.values()) {
      view.destroy();
    }

    this.groupBackgroundViews.clear();
    this.groupBackgroundLayer.removeChildren();

    for (const background of backgrounds) {
      const view = new GroupBackgroundView(background, this.assetStore);

      this.groupBackgroundViews.set(background.key, view);
      this.groupBackgroundLayer.addChild(view.container);
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

  #setupCulling(scene: TreeSceneRenderModel) {
    this.culling?.destroy();

    this.culling = new CullingManager(this.viewport, this.nodeViews, this.edgeViews);

    // Build static bounds from scene models
    const nodeBoundsData = scene.nodes.map((n) => ({
      id: n.id,
      x: n.x,
      y: n.y,
      size: passiveTreeTheme.nodes.sizeByKind[n.kind] ?? passiveTreeTheme.nodes.sizeByKind.normal,
    }));

    const edgeBoundsData = scene.edges.map((e) => computeEdgeBounds(e));

    this.culling.build(nodeBoundsData, edgeBoundsData);

    this.viewport.on("moved", () => this.culling?.cullDeferred());
    this.viewport.on("zoomed", () => this.culling?.cullDeferred());
    this.viewport.on("moved-end", () => this.culling?.cull());
    //
    // Initial cull pass
    this.culling.cull();
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

    for (const graphics of this.groupBackgroundViews.values()) {
      graphics.destroy();
    }

    this.groupBackgroundViews.clear();

    this.backgroundLayer.removeChildren();
    this.edgeLayer.removeChildren();
    this.nodeLayer.removeChildren();
    this.overlayLayer.removeChildren();
    this.groupBackgroundLayer.removeChildren();

    this.culling?.destroy();
    this.culling = null;

    this.viewport.removeAllListeners();
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
