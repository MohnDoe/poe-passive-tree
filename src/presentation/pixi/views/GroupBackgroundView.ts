import { Container, Sprite, Texture } from "pixi.js";
import type { PassiveTreeAssetStore } from "../PassiveTreeAssetStore";
import type { GroupBackgroundRenderModel } from "../models/Render";

export class GroupBackgroundView {
  readonly key: string;
  readonly container: Container;

  protected readonly sprite: Sprite;
  protected readonly mirroredSprite: Sprite;

  protected readonly assetStore: PassiveTreeAssetStore;
  protected readonly model: GroupBackgroundRenderModel;

  constructor(model: GroupBackgroundRenderModel, assetStore: PassiveTreeAssetStore) {
    this.model = model;
    this.key = model.key;

    this.assetStore = assetStore;

    this.container = new Container({
      position: { x: model.x, y: model.y },
      eventMode: "none",
      scale: 2,
    });

    this.sprite = new Sprite({ anchor: 0.5 });
    this.mirroredSprite = new Sprite({ anchor: 0.5, renderable: false });

    this.container.addChild(this.sprite, this.mirroredSprite);

    this.#draw();
  }

  #draw() {
    const texture = this.assetStore.getGroupBackgroundTexture(this.model.image);

    if (texture === Texture.EMPTY) {
      console.warn(`[GroupBackgroundView] No group background texture found for key ${this.key} using image ${this.model.image}`);
      return;
    }

    this.sprite.texture = texture;
    this.sprite.setSize(texture.width, texture.height);

    if (this.model.isHalfImage) {
      this.mirroredSprite.texture = texture;
      this.mirroredSprite.scale.y = -1;
      this.mirroredSprite.setSize(texture.width, texture.height);
      this.mirroredSprite.renderable = true;

      this.sprite.position.y = -texture.height / 2;
      this.mirroredSprite.position.y = texture.height / 2;
    }
  }

  destroy() {
    this.container.removeAllListeners().destroy({ children: true });
  }
}
