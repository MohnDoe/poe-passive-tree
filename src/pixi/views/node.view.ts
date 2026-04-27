import { Container, Graphics } from "pixi.js";
import type {
  NodeRenderModel,
  NodeStateModel,
  NodeView,
  NodeViewCallbacks,
  NodeVisualStyle,
} from "../models/Node";
import { resolveNodeStyle } from "../theme/nodeStyle.resolver";

const defaultState: NodeStateModel = {
  isAllocated: false,
  isHovered: false,
  isInPreviewPath: false,
  isActiveClassStart: false,
  isInRefundPath: false,
};

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

  container.addChild(visible);

  let currentState = { ...defaultState };
  let currentStyle = resolveNodeStyle(model, currentState);

  const draw = (style: NodeVisualStyle) => {
    // use sprite later
    const { radius, fill, scale, alpha } = style;

    visible.clear();
    visible.circle(0, 0, radius);
    visible.fill(fill);

    container.scale.set(scale);
    container.alpha = alpha;
  };

  const updateState = (nextState: NodeStateModel) => {
    if (sameState(currentState, nextState)) return;

    const nextStyle = resolveNodeStyle(model, nextState);

    if (!sameStyle(currentStyle, nextStyle)) {
      draw(nextStyle);
      currentStyle = nextStyle;
    }
    currentState = { ...nextState };
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

  draw(currentStyle);

  return {
    id: model.id,
    container,
    updateState,
    destroy,
  };
}

function sameState(prev: NodeStateModel, next: NodeStateModel): boolean {
  return (
    prev.isInPreviewPath === next.isInPreviewPath &&
    prev.isActiveClassStart === next.isActiveClassStart &&
    prev.isAllocated === next.isAllocated &&
    prev.isHovered === next.isHovered &&
    prev.isInRefundPath === next.isInRefundPath
  );
}

function sameStyle(prev: NodeVisualStyle, next: NodeVisualStyle): boolean {
  return (
    prev.alpha === next.alpha &&
    prev.fill === next.fill &&
    prev.radius === next.radius &&
    prev.scale === next.radius
  );
}
