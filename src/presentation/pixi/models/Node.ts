import type { NodeId, PassiveNodeKind } from "@/domain/graph/PassiveNode";
import type { SpriteCategoryName } from "@/domain/graph/PassiveTreeRenderAssets";

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
  size: number;
  iconSpriteCategory: SpriteCategoryName;
}

export interface NodeViewCallbacks {
  onClick?: (nodeId: NodeId) => void;
  onHover?: (nodeId: NodeId | null) => void;
}
