import { Graphics } from "pixi.js";
import type { EdgeRenderModel, EdgeRenderState, EdgeView, EdgeVisualStyle } from "../models/Edge";
import { resolveEdgeStyle } from "../theme/edgeStyle.resolver";

const defaultState: EdgeRenderState = {
  highlighted: false,
  active: false,
};

export function createEdgeView(edge: EdgeRenderModel): EdgeView {
  const graphics = new Graphics();
  const draw = (style: EdgeVisualStyle) => {
    graphics.clear();
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

    graphics.stroke(style.stroke);
  };

  let currentState = { ...defaultState };
  let currentStyle = resolveEdgeStyle(currentState);

  const updateState = (nextState: EdgeRenderState) => {
    if (sameState(currentState, nextState)) return;

    const nextStyle = resolveEdgeStyle(nextState);

    if (!sameStyle(currentStyle, nextStyle)) {
      draw(nextStyle);
      currentStyle = nextStyle;
    }

    currentState = { ...nextState };
  };

  const destroy = () => {
    graphics.destroy();
  };

  draw(currentStyle);

  return {
    key: edge.key,
    graphics,
    destroy,
    updateState,
  };
}

function sameState(prev: EdgeRenderState, next: EdgeRenderState): boolean {
  return prev.active === next.active && prev.highlighted === next.highlighted;
}

function sameStyle(prev: EdgeVisualStyle, next: EdgeVisualStyle): boolean {
  return (
    prev.stroke.alpha === next.stroke.alpha &&
    prev.stroke.color === next.stroke.color &&
    prev.stroke.width === next.stroke.width
  );
}
