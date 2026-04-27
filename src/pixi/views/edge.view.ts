import { Graphics } from "pixi.js";
import type { EdgeRenderModel, EdgeRenderState, EdgeView, EdgeVisualStyle } from "../models/Edge";
import { resolveEdgeStyle } from "../theme/edgeStyle.resolver";
import { makeShallowEqual } from "@/utils/utils";

const defaultState: EdgeRenderState = {
  highlighted: false,
  active: false,
  refund: false,
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

    graphics.stroke({
      width: style.strokeWidth,
      alpha: style.strokeAlpha,
      color: style.strokeColor,
    });
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

const sameState = makeShallowEqual<EdgeRenderState>({
  refund: true,
  active: true,
  highlighted: true,
});

const sameStyle = makeShallowEqual<EdgeVisualStyle>({
  strokeAlpha: true,
  strokeColor: true,
  strokeWidth: true,
});
