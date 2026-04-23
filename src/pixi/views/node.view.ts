import { Circle, Container, Graphics } from "pixi.js";
import type { NodeRenderModel } from "../types/render.models";
import type { NodeViewCallbacks, NodeView } from "../types/render.views";

function getVisualRadius(model: NodeRenderModel): number {
  switch (model.kind) {
    case "ascendancyStart":
      return 20;
    case "proxy":
      return 25;
    case "classStart":
      return 200;
    case "keystone":
      return 85;
    case "notable":
    case "jewel":
      return 55;
    case "mastery":
      return 70;
    case "normal":
    default:
      return 35;
  }
}

function getFillColor(model: NodeRenderModel): number {
  if (model.isAllocated) return 0xf2c14e;
  if (model.isActiveClassStart) return 0x6ecb63;

  switch (model.kind) {
    case "ascendancyStart":
      return 0xff0000;
    case "keystone":
      return 0xd96bff;
    case "notable":
      return 0x5da9e9;
    case "jewel":
      return 0xff7f50;
    case "mastery":
      return 0x909f9f;
    case "proxy":
      return 0x0000ff;
    case "normal":
    case "classStart":
    default:
      return 0xcfcfcf;
  }
}

export function createNodeView(
  model: NodeRenderModel,
  callbacks: NodeViewCallbacks = {},
): NodeView {
  const container = new Container({
    position: { x: model.x, y: model.y },
    eventMode: "static",
    cursor: "pointer",
  });

  const visible = new Graphics();
  const hitTarget = new Graphics();

  container.addChild(hitTarget, visible);

  const redraw = (next: NodeRenderModel) => {
    const radius = getVisualRadius(next);
    const fill = getFillColor(next);

    visible.clear();
    visible.circle(0, 0, radius);
    visible.fill(fill);

    hitTarget.clear();
    hitTarget.circle(0, 0, radius * 1.1);
    hitTarget.fill({ color: "white", alpha: 0.001 });

    container.hitArea = new Circle(0, 0, radius * 1.1);
  };

  container.on("pointertap", () => {
    callbacks.onClick?.(model.id);
  });
  container.on("pointerover", () => {
    callbacks.onHover?.(model.id);
  });
  container.on("pointerout", () => {
    callbacks.onHover?.(null);
  });

  const destroy = () => {
    container.removeAllListeners();
    container.destroy({ children: true });
  };

  redraw(model);

  return {
    id: model.id,
    container,
    hitTarget,
    redraw,
    destroy,
  };
}
