import { Graphics } from "pixi.js";
import type { EdgeRenderModel, EdgeView } from "../models/Edge";

export function createEdgeView(edge: EdgeRenderModel): EdgeView {
  const graphics = new Graphics();
  const draw = () => {
    if (edge.kind === "line") {
      graphics.moveTo(edge.from.x, edge.from.y);
      graphics.lineTo(edge.to.x, edge.to.y);
    } else {
      graphics.arc(
        edge.center.x,
        edge.center.y,
        edge.radius,
        edge.startAngle,
        edge.endAngle,
        edge.anticlockwise,
      );
    }

    graphics.stroke({
      color: 0x2d2b21,
      width: 15,
      alpha: 1,
    });
  };

  const destroy = () => {
    graphics.destroy();
  };
  draw();

  return {
    key: edge.key,
    graphics,
    destroy,
  };
}
