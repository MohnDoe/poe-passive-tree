import { Graphics } from "pixi.js";
import type {
  EdgeRenderModel,
  EdgeBuildState,
  EdgeView,
  EdgeVisualStyle,
  EdgeHoverState,
} from "../models/Edge";
import { resolveEdgeStyle } from "../theme/edgeStyle.resolver";
import { makeShallowEqual } from "@/shared/utils/utils";

const defaultBuildState: EdgeBuildState = {
  isActive: false,
};
const defaultHoverState: EdgeHoverState = {
  isHighlighted: false,
  isInRefundPath: false,
};

export function createEdgeView(edge: EdgeRenderModel): EdgeView {
  const graphics = new Graphics();

  let currentBuildState = { ...defaultBuildState };
  let currentHoverState = { ...defaultHoverState };
  let currentStyle = resolveEdgeStyle(currentBuildState, currentHoverState);

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

  const redraw = () => {
    const nextStyle = resolveEdgeStyle(currentBuildState, currentHoverState);
    if (!sameStyle(currentStyle, nextStyle)) {
      draw(nextStyle);
      currentStyle = nextStyle;
    }
  };

  const updateBuildState = (next: EdgeBuildState) => {
    if (sameBuildState(currentBuildState, next)) return;
    currentBuildState = next;
    redraw();
  };

  const updateHoverState = (next: EdgeHoverState) => {
    if (sameHoverState(currentHoverState, next)) return;
    currentHoverState = next;
    redraw();
  };

  draw(currentStyle);

  return {
    key: edge.key,
    graphics,
    destroy: () => graphics.destroy(),
    updateBuildState,
    updateHoverState,
  };
}

const sameBuildState = makeShallowEqual<EdgeBuildState>({
  isActive: true,
});

const sameHoverState = makeShallowEqual<EdgeHoverState>({
  isInRefundPath: true,
  isHighlighted: true,
});

const sameStyle = makeShallowEqual<EdgeVisualStyle>({
  strokeAlpha: true,
  strokeColor: true,
  strokeWidth: true,
});
