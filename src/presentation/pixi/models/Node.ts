import type { NodeId, PassiveNodeKind } from "@/domain/graph/PassiveNode";
import type { Container } from "pixi.js";

export interface NodeRenderModel {
  id: NodeId;
  x: number;
  y: number;
  kind: PassiveNodeKind;
  icon: string;
}

export interface NodeBuildState {
  isAllocated: boolean;
  isActiveClassStart?: boolean;
}

export interface NodeHoverState {
  isHovered: boolean;
  isInPreviewPath: boolean;
  isInRefundPath: boolean;
}

export interface NodeVisualStyle {
  radius: number;
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
  updateBuildState: (state: NodeBuildState) => void;
  updateHoverState: (state: NodeHoverState) => void;
  destroy: () => void;
}
