import type { NodeId, PassiveNodeKind } from "@/domain/models/passiveNode";
import type { Point } from "pixi.js";

export interface NodeRenderModel {
  id: NodeId;
  x: number;
  y: number;
  kind: PassiveNodeKind;
  isActiveClassStart?: boolean;
  isAllocated?: boolean;
}

export interface GroupBackgroundRenderModel {
  key: string;
  x: number;
  y: number;
  radius: number;
  color: number;
  alpha: number;
}

export type LinkRenderModel =
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
    };

export interface TreeSceneRenderModel {
  backgrounds: GroupBackgroundRenderModel[];
  links: LinkRenderModel[];
  nodes: NodeRenderModel[];
  highlightedPath: Point[];
}
