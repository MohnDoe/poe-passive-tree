import { Container, Sprite, Texture } from "pixi.js";
import type { PassiveTreeAssetStore } from "../PassiveTreeAssetStore";
import type { GroupBackgroundRenderModel } from "../models/Render";

export class GroupBackgroundView {
  readonly key: string;
  readonly container: Container;

  protected readonly sprite: Sprite;

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

    this.container.addChild(this.sprite);

    this.#draw();

    // this.container.cacheAsTexture(true);
    // // force cache to update on the next frame after creation
    // requestAnimationFrame(() => {
    //   this.container.updateCacheTexture();
    // });
  }

  #draw() {
    const texture = this.assetStore.getGroupBackgroundTexture(this.model.image);

    if (texture === Texture.EMPTY) {
      console.warn(`No group background texture ${this.model.image}`);
    }

    this.sprite.texture = texture;
    // this.sprite.setSize(texture.source.width, texture.source.height);
  }

  destroy() {
    this.container.removeAllListeners().destroy({ children: true });
  }
}
