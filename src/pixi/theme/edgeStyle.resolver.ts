import type { EdgeRenderState, EdgeVisualStyle } from "../models/Edge";
import { passiveTreeTheme } from "./passiveTree.theme";

export function resolveEdgeStyle(state: EdgeRenderState): EdgeVisualStyle {
  let color = passiveTreeTheme.edges.colors.normal;

  if (state.highlighted) {
    color = passiveTreeTheme.edges.colors.highlighted;
  }

  if (state.active) {
    color = passiveTreeTheme.edges.colors.active;
  }

  if (state.refund) {
    color = passiveTreeTheme.edges.colors.refund;
  }

  return {
    strokeWidth: passiveTreeTheme.edges.stroke,
    strokeAlpha: passiveTreeTheme.edges.alpha,
    strokeColor: color,
  };
}
