import type { NodeRenderModel, NodeVisualStyle } from "../models/Node";
import { passiveTreeTheme } from "./passiveTree.theme";

export function resolveNodeStyle(model: NodeRenderModel): NodeVisualStyle {
  const { nodes: nodesTheme } = passiveTreeTheme;
  const radius = nodesTheme.radiusByKind[model.kind] ?? nodesTheme.radiusByKind.normal;

  return {
    radius,
    alpha: 1,
    scale: 1,
  };
}
