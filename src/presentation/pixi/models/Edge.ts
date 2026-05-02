import type { EdgeKey } from "@/domain/graph/GraphEdge";
import type { Graphics, Point } from "pixi.js";

export type EdgeRenderModel =
  | {
      key: string;
      kind: "line";
      from: Point;
      to: Point;
    }
  | {
      key: string;
      kind: "arc";
      center: Point;
      radius: number;
      startAngle: number;
      endAngle: number;
      anticlockwise: boolean;
    };

export interface EdgeBuildState {
  isActive: boolean;
}

export interface EdgeHoverState {
  isHighlighted: boolean;
  isInRefundPath: boolean;
}

export interface EdgeVisualStyle {
  strokeWidth: number;
  strokeColor: number;
  strokeAlpha: number;
}

export interface EdgeView {
  key: EdgeKey;
  graphics: Graphics;
  destroy: () => void;
  updateBuildState: (state: EdgeBuildState) => void;
  updateHoverState: (state: EdgeHoverState) => void;
}
