import type { Viewport } from "pixi-viewport";
import { Container, Text } from "pixi.js";
import type { CullingManager } from "../CullingManager";

export class DebugOverlay {
  readonly container: Container;

  private cullingStatsLabel: Text;
  private viewport: Viewport;
  private cullingManager: CullingManager;

  constructor(viewport: Viewport, cullingManager: CullingManager) {
    this.viewport = viewport;
    this.cullingManager = cullingManager;

    this.container = new Container({ label: "debugOverlay", eventMode: "none" });

    this.cullingStatsLabel = new Text({
      text: "",
      style: {
        fill: 0x00ff88,
        fontSize: 13,
        fontFamily: "monospace",
        dropShadow: { color: 0x000000, blur: 4, distance: 0, alpha: 0.8 },
      },
    });

    this.#updateCullingStatsLabelPosition();
  }

  getStatsLabel(): Text {
    return this.cullingStatsLabel;
  }

  update() {
    this.#updateCullingStats();
  }

  #updateCullingStatsLabelPosition() {
    this.cullingStatsLabel.position.set(
      this.viewport.screenWidth - this.cullingStatsLabel.width - 16,
      this.viewport.screenHeight - this.cullingStatsLabel.height - 16,
    );
  }

  #updateCullingStats() {
    let visibleNodes = 0;
    let culledNodes = 0;

    let visibleEdges = 0;
    let culledEdges = 0;
    for (const view of this.cullingManager.getNodeViews().values()) {
      if (view.container.renderable) visibleNodes++;
      else culledNodes++;
    }

    const totalNodes = visibleNodes + culledNodes;
    const pctNodes = totalNodes > 0 ? ((culledNodes / totalNodes) * 100).toFixed(1) : "0";

    for (const view of this.cullingManager.getEdgeViews().values()) {
      if (view.graphics.renderable) visibleEdges++;
      else culledEdges++;
    }
    const totalEdges = visibleEdges + culledEdges;
    const pctEdges = totalEdges > 0 ? ((culledEdges / totalEdges) * 100).toFixed(1) : "0";
    this.cullingStatsLabel.text = [
      `── Culling Debug ──`,
      `─ Nodes ─`,
      `Visible : ${visibleNodes}`,
      `Culled  : ${culledNodes} (${pctNodes}%)`,
      `Total   : ${totalNodes}`,
      `─ Edges ─`,
      `Visible : ${visibleEdges}`,
      `Culled  : ${culledEdges} (${pctEdges}%)`,
      `Total   : ${totalEdges}`,
      `-------`,
      `Scale    : ${this.viewport.scale.x.toFixed(3)}`,
    ].join("\n");

    this.#updateCullingStatsLabelPosition();
  }

  destroy() {
    this.container.destroy({ children: true });
    this.cullingStatsLabel.destroy();
  }
}
