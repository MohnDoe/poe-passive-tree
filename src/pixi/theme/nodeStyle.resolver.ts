import type { NodeRenderModel, NodeStateModel, NodeVisualStyle } from "../models/Node";
import { passiveTreeTheme } from "./passiveTree.theme";

export function resolveNodeStyle(model: NodeRenderModel, state: NodeStateModel): NodeVisualStyle {
  const { nodes: nodesTheme } = passiveTreeTheme;
  const radius = nodesTheme.radiusByKind[model.kind] ?? nodesTheme.radiusByKind.normal;

  let fill = nodesTheme.colors.normal;

  if (state.isAllocated) {
    fill = nodesTheme.colors.allocated;
  } else if (state.isActiveClassStart) {
    fill = nodesTheme.colors.activeClassStart;
  } else if (state.isInPreviewPath) {
    fill = nodesTheme.colors.previewPath;
  } else {
    switch (model.kind) {
      case "ascendancyStart":
        fill = nodesTheme.colors.ascendancyStart;
        break;
      case "keystone":
        fill = nodesTheme.colors.keystone;
        break;
      case "notable":
        fill = nodesTheme.colors.notable;
        break;
      case "jewel":
        fill = nodesTheme.colors.jewel;
        break;
      case "mastery":
        fill = nodesTheme.colors.mastery;
        break;
      case "proxy":
        fill = nodesTheme.colors.proxy;
        break;
      case "normal":
      case "classStart":
      default:
        fill = nodesTheme.colors.normal;
        break;
    }
  }

  return {
    radius,
    fill,
    alpha: 1,
    scale: state.isHovered ? 1.06 : 1,
  };
}
