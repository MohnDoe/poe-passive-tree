import type { Viewport } from "pixi-viewport";
import type { BaseNodeView } from "../views/BaseNodeView";
import type { EdgeView } from "../models/Edge";
import type { NodeId } from "@/domain/graph/PassiveNode";
import type { EdgeKey } from "@/domain/graph/GraphEdge";

interface CullableBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export class CullingManager {
  // Pre-computed world-space AABB per node (never changes)
  private nodeBounds = new Map<NodeId, CullableBounds>();
  // Pre-computed world-space AABB per edge (never changes)
  private edgeBounds = new Map<EdgeKey, CullableBounds>();

  private viewport: Viewport;
  private nodeViews: Map<NodeId, BaseNodeView>;
  private edgeViews: Map<EdgeKey, EdgeView>;

  // Padding so nodes at the edge of the frustum don't pop in/out
  private readonly CULL_MARGIN = 64; // world-space px

  private _rafId: number | null = null;

  constructor(
    viewport: Viewport,
    nodeViews: Map<NodeId, BaseNodeView>,
    edgeViews: Map<EdgeKey, EdgeView>,
  ) {
    this.viewport = viewport;
    this.nodeViews = nodeViews;
    this.edgeViews = edgeViews;
  }

  /**
   * Call once after the scene is rendered.
   * Pre-computes all bounds from static world positions.
   */
  build(
    nodeBoundsData: Array<{ id: NodeId; x: number; y: number; size: number }>,
    edgeBoundsData: Array<{ key: EdgeKey; bounds: CullableBounds }>,
  ) {
    this.nodeBounds.clear();
    this.edgeBounds.clear();

    for (const { id, x, y, size } of nodeBoundsData) {
      const half = size / 2 + this.CULL_MARGIN;
      this.nodeBounds.set(id, {
        minX: x - half,
        minY: y - half,
        maxX: x + half,
        maxY: y + half,
      });
    }

    for (const { key, bounds } of edgeBoundsData) {
      this.edgeBounds.set(key, bounds);
    }
  }

  /**
   * Returns the current viewport frustum in world-space coordinates.
   */
  private getWorldFrustum(): CullableBounds {
    const left = -this.viewport.x / this.viewport.scale.x;
    const top = -this.viewport.y / this.viewport.scale.y;
    const right = left + this.viewport.screenWidth / this.viewport.scale.x;
    const bottom = top + this.viewport.screenHeight / this.viewport.scale.y;

    return { minX: left, minY: top, maxX: right, maxY: bottom };
  }

  private intersects(a: CullableBounds, b: CullableBounds): boolean {
    return a.maxX >= b.minX && a.minX <= b.maxX && a.maxY >= b.minY && a.minY <= b.maxY;
  }

  public getNodeViews(): Map<NodeId, BaseNodeView> {
    return this.nodeViews;
  }

  public getEdgeViews(): Map<NodeId, EdgeView> {
    return this.edgeViews;
  }

  /**
   * Runs one full cull pass. Safe to call on every viewport event.
   */
  cull() {
    const frustum = this.getWorldFrustum();

    for (const [id, view] of this.nodeViews) {
      const bounds = this.nodeBounds.get(id);
      if (!bounds) continue;
      const visible = this.intersects(bounds, frustum);
      // Only touch the property if it actually changed — avoids dirty-flagging
      if (view.container.renderable !== visible) {
        view.container.renderable = visible;
        // Also disable events for off-screen nodes — no hit-test waste
        view.container.eventMode = visible ? "static" : "none";
      }
    }

    for (const [key, view] of this.edgeViews) {
      const bounds = this.edgeBounds.get(key);
      if (!bounds) continue;
      const visible = this.intersects(bounds, frustum);
      if (view.graphics.renderable !== visible) {
        view.graphics.renderable = visible;
      }
    }
  }

  /**
   * Throttled version: defers to next rAF, collapses rapid viewport events.
   */
  cullDeferred() {
    if (this._rafId !== null) return;
    this._rafId = requestAnimationFrame(() => {
      this._rafId = null;
      this.cull();
    });
  }

  destroy() {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }
}
