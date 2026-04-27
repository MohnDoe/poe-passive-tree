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

  return {
    stroke: {
      width: passiveTreeTheme.edges.stroke,
      alpha: passiveTreeTheme.edges.alpha,
      color,
    },
  };
}
