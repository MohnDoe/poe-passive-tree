import { makeShallowEqual } from "@/shared/utils/utils";
import { Container, Sprite } from "pixi.js";
import type { PassiveTreeAssetStore } from "../PassiveTreeAssetStore";
import type {
  NodeBuildState,
  NodeHoverState,
  NodeRenderModel,
  NodeView,
  NodeViewCallbacks,
  NodeVisualStyle,
} from "../models/Node";
import { resolveNodeStyle } from "../theme/nodeStyle.resolver";

const defaultBuildState: NodeBuildState = {
  isAllocated: false,
  isActiveClassStart: false,
};

const defaultHoverState: NodeHoverState = {
  isHovered: false,
  isInPreviewPath: false,
  isInRefundPath: false,
};

export interface CreateNodeViewParams {
  model: NodeRenderModel;
  assetStore: PassiveTreeAssetStore;
  callbacks: NodeViewCallbacks;
}

export function createNodeView({
  model,
  assetStore,
  callbacks = {},
}: CreateNodeViewParams): NodeView {
  let currentBuildState = { ...defaultBuildState };
  let currentHoverState = { ...defaultHoverState };

  let currentStyle = resolveNodeStyle(model);

  const container = new Container({
    position: { x: model.x, y: model.y },
    eventMode: "static",
    // TODO: change this when not reachable/allocatable
    cursor: "pointer",
  });

  const iconSprite = new Sprite();
  container.addChild(iconSprite);

  const draw = (style: NodeVisualStyle) => {
    const { scale, alpha, radius } = style;

    //TODO: use currentZoom from stage
    const texture = assetStore.getNodeIconTexture(model, currentBuildState, currentHoverState, 1);

    iconSprite.texture = texture;
    iconSprite.anchor.set(0.5);
    iconSprite.setSize(radius);

    container.scale.set(scale);
    container.alpha = alpha;
  };

  const redraw = () => {
    const nextStyle = resolveNodeStyle(model);

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
  radius: true,
  scale: true,
});
