import type {
  MasteryNodeRenderModel,
  MasteryNodeVisualStyle,
  NodeBuildState,
  NodeHoverState,
  NodeRenderModel,
  NodeVisualStyle,
} from "../models/Node";
import { passiveTreeTheme } from "./passiveTree.theme";
import { resolveFrameCoordsKey, resolveSpriteCategoryName } from "./sprite.resolver";

export function resolveNodeStyle(
  model: NodeRenderModel,
  build: NodeBuildState,
  hover: NodeHoverState,
): NodeVisualStyle {
  const { nodes: nodesTheme } = passiveTreeTheme;
  const size = nodesTheme.sizeByKind[model.kind] ?? nodesTheme.sizeByKind.normal;
  const categoryName = resolveSpriteCategoryName(model.kind, build, hover);
  const frameCoordsKey = resolveFrameCoordsKey(model.kind, build, hover);

  return {
    size,
    iconSpriteCategory: categoryName,
    frameCoordsKey,
  };
}

export function resolveMasteryNodeStyle(
  model: MasteryNodeRenderModel,
  build: NodeBuildState,
  hover: NodeHoverState,
): MasteryNodeVisualStyle {
  const visualStyle = resolveNodeStyle(model, build, hover);
  let effectImage = null;

  if (build.isAllocated) {
    effectImage = model.activeEffectImage;
  }

  return {
    ...visualStyle,
    size: visualStyle.size * 2,
    effectImage,
    frameCoordsKey: null,
  };
}
