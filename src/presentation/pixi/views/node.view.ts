import { Container, Graphics } from "pixi.js";
import type {
  NodeRenderModel,
  NodeBuildState,
  NodeView,
  NodeViewCallbacks,
  NodeVisualStyle,
  NodeHoverState,
} from "../models/Node";
import { resolveNodeStyle } from "../theme/nodeStyle.resolver";
import { makeShallowEqual } from "@/shared/utils/utils";

const defaultBuildState: NodeBuildState = {
  isAllocated: false,
  isActiveClassStart: false,
};

const defaultHoverState: NodeHoverState = {
  isHovered: false,
  isInPreviewPath: false,
  isInRefundPath: false,
};

export function createNodeView(
  model: NodeRenderModel,
  callbacks: NodeViewCallbacks = {},
): NodeView {
  let currentBuildState = { ...defaultBuildState };
  let currentHoverState = { ...defaultHoverState };

  let currentStyle = resolveNodeStyle(model, currentBuildState, currentHoverState);

  const container = new Container({
    position: { x: model.x, y: model.y },
    eventMode: "static",
    // TODO: change this when not reachable/allocatable
    cursor: "pointer",
  });

  const visible = new Graphics();

  container.addChild(visible);

  const draw = (style: NodeVisualStyle) => {
    // use sprite later
    const { radius, fill, scale, alpha } = style;

    visible.clear();
    visible.circle(0, 0, radius);
    visible.fill(fill);

    container.scale.set(scale);
    container.alpha = alpha;
  };

  const redraw = () => {
    const nextStyle = resolveNodeStyle(model, currentBuildState, currentHoverState);

    if (!sameStyle(currentStyle, nextStyle)) {
      draw(nextStyle);
      currentStyle = nextStyle;
    }
  };

  const updateBuildState = (next: NodeBuildState) => {
    if (sameBuildState(currentBuildState, next)) return;
    currentBuildState = next;
    redraw();
  };

  const updateHoverState = (next: NodeHoverState) => {
    if (sameHoverState(currentHoverState, next)) return;
    currentHoverState = next;
    redraw();
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
    updateBuildState,
    updateHoverState,
    destroy,
  };
}

const sameBuildState = makeShallowEqual<NodeBuildState>({
  isAllocated: true,
  isActiveClassStart: true,
});

const sameHoverState = makeShallowEqual<NodeHoverState>({
  isHovered: true,
  isInPreviewPath: true,
  isInRefundPath: true,
});

const sameStyle = makeShallowEqual<NodeVisualStyle>({
  alpha: true,
  fill: true,
  radius: true,
  scale: true,
});
