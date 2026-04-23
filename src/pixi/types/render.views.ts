import type { NodeId } from "@/domain/models/passiveNode";
import type { Container, Graphics } from "pixi.js";
import type { NodeStateModel } from "./render.models";

export interface TreeRendererCallbacks {
  onNodeClick?: (nodeId: NodeId) => void;
  onNodeHover?: (nodeId: NodeId | null) => void;
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
