import type {
  MasteryNodeRenderModel,
  MasteryNodeVisualStyle,
  NodeVisualStyle,
} from "../models/Node";
import { resolveMasteryNodeStyle } from "../theme/nodeStyle.resolver";
import { BaseNodeView } from "./BaseNodeView";

export class MasteryNodeView extends BaseNodeView {
  resolveNodeStyle(): MasteryNodeVisualStyle {
    return resolveMasteryNodeStyle(
      this.model as MasteryNodeRenderModel,
      this.buildState,
      this.hoverState,
    );
  }

  draw(style: NodeVisualStyle) {
    super.draw(style);

    this.iconSprite.texture = this.assetStore.getMasteryNodeIconTexture(
      this.model as MasteryNodeRenderModel,
      style.iconSpriteCategory,
    );
  }
}
