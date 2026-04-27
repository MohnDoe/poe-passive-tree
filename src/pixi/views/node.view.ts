import { Circle, Container, Graphics } from "pixi.js";
import type {
  NodeRenderModel,
  NodeStateModel,
  NodeView,
  NodeViewCallbacks,
  NodeVisualStyle,
} from "../models/Node";
import { resolveNodeStyle } from "../theme/nodeStyle.resolver";
import { passiveTreeTheme } from "../theme/passiveTree.theme";

function sameState(prev: NodeStateModel, next: NodeStateModel): boolean {
  return (
    prev.isInPreviewPath === next.isInPreviewPath &&
    prev.isActiveClassStart === next.isActiveClassStart &&
    prev.isAllocated === next.isAllocated &&
    prev.isHovered === next.isHovered
  );
}

const defaultState: NodeStateModel = {
  isAllocated: false,
  isHovered: false,
  isInPreviewPath: false,
};

const defaultStyle: NodeVisualStyle = {
  scale: 1,
  alpha: 1,
  fill: passiveTreeTheme.nodes.colors.normal,
  radius: passiveTreeTheme.nodes.radiusByKind.normal,
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
  const hitTarget = new Graphics();

  container.addChild(hitTarget, visible);

  const currentState = defaultState;
  const currentStyle = defaultStyle;

  const draw = (style: NodeVisualStyle) => {
    // use sprite later
    const { radius, fill, scale, alpha } = style;

    visible.clear();
    visible.circle(0, 0, radius);
    visible.fill(fill);

    hitTarget.circle(0, 0, radius * 1.1);
    hitTarget.fill({ color: "white", alpha: 0.001 });
    container.hitArea = new Circle(0, 0, radius * 1.1);

    container.scale = scale;
    container.alpha = alpha;
  };

  const updateState = (state: NodeStateModel) => {
    if (sameState(currentState, state)) return;

    const nextStyle = resolveNodeStyle(model, state);
    // TODO: maybe check if style is really new ? But that's annoying to do

    draw(nextStyle);
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
    hitTarget,
    updateState,
    destroy,
  };
}
