import type { GraphEdge } from "@/domain/graph/GraphEdge";
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

export interface EdgeRenderState {
  active: boolean;
  highlighted: boolean;
  refund: boolean;

  // TODO: refundable, alternative (for when 2 preview path are equal)
}

export interface EdgeVisualStyle {
  strokeWidth: number;
  strokeColor: number;
  strokeAlpha: number;
}

export interface EdgeView {
  key: GraphEdge["key"];
  graphics: Graphics;
  destroy: () => void;
  updateState: (state: EdgeRenderState) => void;
}
