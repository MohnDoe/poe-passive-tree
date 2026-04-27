import { Container, Graphics } from "pixi.js";
import type {
  NodeRenderModel,
  NodeStateModel,
  NodeView,
  NodeViewCallbacks,
  NodeVisualStyle,
} from "../models/Node";
import { resolveNodeStyle } from "../theme/nodeStyle.resolver";
import { makeShallowEqual } from "@/utils/utils";

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

const sameState = makeShallowEqual<NodeStateModel>({
  isInRefundPath: true,
  isAllocated: true,
  isHovered: true,
  isInPreviewPath: true,
  isActiveClassStart: true,
});

const sameStyle = makeShallowEqual<NodeVisualStyle>({
  alpha: true,
  fill: true,
  radius: true,
  scale: true,
});
