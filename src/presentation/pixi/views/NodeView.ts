import type { NodeId } from "@/domain/graph/PassiveNode";
import type { ZoomLevel } from "@/domain/graph/PassiveTreeRenderAssets";
import { makeShallowEqual } from "@/shared/utils/utils";
import { Container, Graphics, Sprite, Texture } from "pixi.js";
import type {
  NodeBuildState,
  NodeHoverState,
  NodeRenderModel,
  NodeViewCallbacks,
  NodeVisualStyle,
} from "../models/Node";
import type { PassiveTreeAssetStore } from "../PassiveTreeAssetStore";
import { resolveNodeStyle } from "../theme/nodeStyle.resolver";

interface INodeView {
  id: NodeId;
  container: Container;
  updateBuildState: (state: NodeBuildState) => void;
  updateHoverState: (state: NodeHoverState) => void;
  updateZoomLevel: (zoomLevel: ZoomLevel) => void;
  destroy: () => void;
}

const defaultBuildState: NodeBuildState = {
  isAllocated: false,
  isActiveClassStart: false,
};
const defaultHoverState: NodeHoverState = {
  isHovered: false,
  isInPreviewPath: false,
  isInRefundPath: false,
};

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
  iconSpriteCategory: true,
  frameCoordsKey: true,
  size: true,
});

export class NodeView implements INodeView {
  readonly id: NodeId;
  readonly container: Container;

  protected readonly assetStore: PassiveTreeAssetStore;
  protected readonly model: NodeRenderModel;
  protected readonly callbacks: NodeViewCallbacks;

  protected readonly iconHolder: Container;

  protected readonly iconSprite: Sprite;
  protected iconMask: Graphics;

  protected readonly frameSprite: Sprite;

  #buildState: NodeBuildState;
  #hoverState: NodeHoverState;
  #style: NodeVisualStyle;
  #zoomLevel: ZoomLevel = 0.1246;

  constructor(
    model: NodeRenderModel,
    assetStore: PassiveTreeAssetStore,
    callbacks: NodeViewCallbacks = {},
  ) {
    this.model = model;
    this.id = model.id;

    this.assetStore = assetStore;
    this.callbacks = callbacks;

    this.container = new Container({
      position: { x: model.x, y: model.y },
      eventMode: "static",
      cursor: "pointer",
    });

    this.iconHolder = new Container({});
    this.iconSprite = new Sprite({ anchor: 0.5 });
    this.iconMask = new Graphics();

    this.iconHolder.addChild(this.iconMask, this.iconSprite);

    this.frameSprite = new Sprite({ anchor: 0.5 });

    this.container.addChild(this.iconHolder, this.frameSprite);

    this.#buildState = { ...defaultBuildState };
    this.#hoverState = { ...defaultHoverState };
    this.#style = resolveNodeStyle(model, this.#buildState, this.#hoverState);

    this.#bindEvents();
    this.#draw(this.#style);

    this.container.cacheAsTexture(true);
    // force cache to update on the next frame after creation
    requestAnimationFrame(() => {
      this.container.updateCacheTexture();
    });
  }

  updateBuildState(next: NodeBuildState) {
    if (sameBuildState(this.#buildState, next)) return;
    this.#buildState = next;
    this.#redraw(this.#zoomLevel);
  }

  updateHoverState(next: NodeHoverState) {
    if (sameHoverState(this.#hoverState, next)) return;
    this.#hoverState = next;
    this.#redraw(this.#zoomLevel);
  }

  updateZoomLevel(nextZoomLevel: ZoomLevel) {
    console.log("updateZoomLevel", this.model.id, nextZoomLevel);
    if (this.#zoomLevel === nextZoomLevel) return;
    console.log("updateZoomLevel accepted", this.model.id, nextZoomLevel);
    this.#redraw(nextZoomLevel);
  }

  destroy() {
    this.container.removeAllListeners();
    this.container.destroy({ children: true });
  }

  #draw(style: NodeVisualStyle) {
    const { size, iconSpriteCategory, frameCoordsKey } = style;

    const iconTexture = this.assetStore.getNodeIconTexture(
      this.model,
      iconSpriteCategory,
      this.#zoomLevel,
    );

    if (iconTexture === Texture.EMPTY) {
      console.warn(`No icon texture for node ${this.id} - ${this.model.kind}`);
    }

    if (frameCoordsKey !== null) {
      const frameTexture = this.assetStore.getNodeFrameTexture(frameCoordsKey, this.#zoomLevel);
      if (frameTexture === Texture.EMPTY) {
        console.warn(
          `No frame texture for node ${this.id} - ${this.model.kind} - ${frameCoordsKey}`,
        );
      }
      this.frameSprite.texture = frameTexture;
      this.frameSprite.setSize(size);
    }

    this.iconSprite.texture = iconTexture;
    this.iconSprite.setSize(size);

    this.iconMask.context = this.assetStore.getCircleContext(size);
    this.iconSprite.mask = this.iconMask;
  }

  #redraw(nextZoomLevel: ZoomLevel) {
    const nextStyle = resolveNodeStyle(this.model, this.#buildState, this.#hoverState);
    if (!sameStyle(this.#style, nextStyle) || this.#zoomLevel !== nextZoomLevel) {
      this.#draw(nextStyle);
      this.#style = nextStyle;
      this.#zoomLevel = nextZoomLevel;
      this.container.updateCacheTexture();
    }
  }

  #bindEvents() {
    this.container.on("pointertap", () => {
      this.callbacks.onClick?.(this.model.id);
    });
    this.container.on("pointerover", () => {
      this.callbacks.onHover?.(this.model.id);
    });
    this.container.on("pointerout", () => {
      this.callbacks.onHover?.(null);
    });
  }
}
