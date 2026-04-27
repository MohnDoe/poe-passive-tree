import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import type { EdgeRenderModel } from "./Edge";
import type { NodeRenderModel } from "./Node";

export interface GroupBackgroundRenderModel {
  key: string;
  x: number;
  y: number;
  radius: number;
  color: number;
  alpha: number;
}

export interface TreeSceneRenderModel {
  backgrounds: GroupBackgroundRenderModel[];
  edges: EdgeRenderModel[];
  nodes: NodeRenderModel[];
}

export interface TreeVisualStateModel {
  activeStartNodeIds: ReadonlySet<NodeId>;
  allocatedNodeIds: ReadonlySet<NodeId>;
  // reachableNodeIds: ReadonlySet<NodeId>;
  // allocatableNodeIds: ReadonlySet<NodeId>;
  previewPathNodeIds: ReadonlySet<NodeId>;
  // activeEdgeKeys: ReadonlySet<EdgeKey>;
  // highlightedEdgeKeys: ReadonlySet<EdgeKey>;
  hoveredNodeId: NodeId | null;
}

export interface TreeRendererCallbacks {
  onNodeClick?: (nodeId: NodeId) => void;
  onNodeHover?: (nodeId: NodeId | null) => void;
}
