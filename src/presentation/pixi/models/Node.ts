import type { NodeId, PassiveNodeKind } from "@/domain/graph/PassiveNode";
import type { SpriteCategoryName } from "@/domain/graph/PassiveTreeRenderAssets";

export interface BaseRenderModel {
  id: NodeId;
  x: number;
  y: number;
  kind: PassiveNodeKind;
  icon: string;
}

export type MasteryNodeRenderModel = BaseRenderModel & {
  kind: "mastery";
  activeIcon: string;
  inactiveIcon: string;
  activeEffectImage: string;
};

export type NodeRenderModel = BaseRenderModel;

export interface NodeBuildState {
  isAllocated: boolean;
  isActiveClassStart?: boolean;
}

export interface NodeHoverState {
  isHovered: boolean;
  isInPreviewPath: boolean;
  isInRefundPath: boolean;
}

export interface BaseNodeVisualStyle {
  size: number;
  iconSpriteCategory: SpriteCategoryName;
  frameCoordsKey: string | null;
}

export type NodeVisualStyle = BaseNodeVisualStyle;

export interface MasteryNodeVisualStyle extends BaseNodeVisualStyle {
  effectImage: string | null;
}

export interface NodeViewCallbacks {
  onClick?: (nodeId: NodeId) => void;
  onHover?: (nodeId: NodeId | null) => void;
}
