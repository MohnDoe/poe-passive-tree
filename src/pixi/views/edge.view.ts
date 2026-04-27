import { Graphics } from "pixi.js";
import type { EdgeRenderModel, EdgeRenderState, EdgeView } from "../models/Edge";

function sameState(prev: EdgeRenderState, next: EdgeRenderState): boolean {
  return prev.active === next.active && prev.highlighted === next.highlighted;
}

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

  const currentState: EdgeRenderState = {
    active: false,
    highlighted: false,
  };

  const updateState = (state: EdgeRenderState) => {
    if (sameState(currentState, state)) return;
  };

  const destroy = () => {
    graphics.destroy();
  };

  draw();
  updateState(currentState);

  return {
    key: edge.key,
    graphics,
    destroy,
    updateState,
  };
}
