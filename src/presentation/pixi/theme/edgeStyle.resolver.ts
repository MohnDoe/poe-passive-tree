import type { EdgeBuildState, EdgeHoverState, EdgeVisualStyle } from "../models/Edge";
import { passiveTreeTheme } from "./passiveTree.theme";

export function resolveEdgeStyle(
  buildState: EdgeBuildState,
  hoverState: EdgeHoverState,
): EdgeVisualStyle {
  let color = passiveTreeTheme.edges.colors.normal;

  if (hoverState.isHighlighted) color = passiveTreeTheme.edges.colors.highlighted;
  if (buildState.isActive) color = passiveTreeTheme.edges.colors.active;
  if (hoverState.isInRefundPath) color = passiveTreeTheme.edges.colors.refund;

  return {
    strokeWidth: passiveTreeTheme.edges.stroke,
    strokeAlpha: passiveTreeTheme.edges.alpha,
    strokeColor: color,
  };
}
