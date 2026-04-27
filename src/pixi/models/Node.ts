import type { NodeId, PassiveNodeKind } from "@/domain/passiveGraph/PassiveNode";
import type { Container, Graphics } from "pixi.js";

export interface NodeRenderModel {
  id: NodeId;
  x: number;
  y: number;
  kind: PassiveNodeKind;
}

export interface NodeStateModel {
  isAllocated: boolean;
  isHovered: boolean;
  isInPreviewPath: boolean;
  isActiveClassStart?: boolean;
}

export interface NodeVisualStyle {
  radius: number;
  fill: number;
  alpha: number;
  scale: number;
}

export interface NodeViewCallbacks {
  onClick?: (nodeId: NodeId) => void;
  onHover?: (nodeId: NodeId | null) => void;
}

export interface NodeView {
  id: NodeId;
  container: Container;
  hitTarget: Graphics;
  updateState: (state: NodeStateModel) => void;
  destroy: () => void;
}
