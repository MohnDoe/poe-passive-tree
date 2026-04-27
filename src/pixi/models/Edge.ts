import type { GraphEdge } from "@/domain/passiveGraph/GraphEdge";
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
  isActive: boolean;
  //is preview blabla bla
}

export interface EdgeView {
  key: GraphEdge["key"];
  graphics: Graphics;
  destroy: () => void;
}
