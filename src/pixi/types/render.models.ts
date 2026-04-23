import type { ClassId } from "@/domain/models/passiveClass";
import type { NodeId, PassiveNodeKind } from "@/domain/models/passiveNode";
import type { Point } from "pixi.js";

export interface NodeRenderModel {
  id: NodeId;
  x: number;
  y: number;
  kind: PassiveNodeKind;
}

export interface NodeStateModel {
  isAllocated: boolean;
  isHovered: boolean;
  isInPath: boolean;
  isActiveClassStart?: boolean;
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
      anticlockwise: boolean;
    };

export interface TreeSceneRenderModel {
  backgrounds: GroupBackgroundRenderModel[];
  links: LinkRenderModel[];
  nodes: NodeRenderModel[];
}

export interface TreeVisualStateModel {
  allocatedNodeIds: Set<NodeId>;
  hoveredNodeId: NodeId | null;
  highlightedPathNodeIds: NodeId[];
  activeClassId: ClassId | null;
  activeAscendancy: string | null;
  activeStartNodeIds: Set<NodeId>;
}
