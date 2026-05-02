import type {
  NodeRenderModel,
  NodeBuildState,
  NodeVisualStyle,
  NodeHoverState,
} from "../models/Node";
import { passiveTreeTheme } from "./passiveTree.theme";

export function resolveNodeStyle(
  model: NodeRenderModel,
  buildState: NodeBuildState,
  hoverState: NodeHoverState,
): NodeVisualStyle {
  const { nodes: nodesTheme } = passiveTreeTheme;
  const radius = nodesTheme.radiusByKind[model.kind] ?? nodesTheme.radiusByKind.normal;

  let fill = nodesTheme.colors.normal;

  if (hoverState.isInRefundPath) {
    fill = nodesTheme.colors.refund;
  } else if (buildState.isAllocated) {
    fill = nodesTheme.colors.allocated;
  } else if (buildState.isActiveClassStart) {
    fill = nodesTheme.colors.activeClassStart;
  } else if (hoverState.isInPreviewPath) {
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
    //TODO: this should only be true if it's reachable/allocatable
    scale: hoverState.isHovered ? 1.06 : 1,
  };
}
