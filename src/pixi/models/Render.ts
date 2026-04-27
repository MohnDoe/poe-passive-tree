import type { NodeId } from "@/domain/passiveGraph/PassiveNode";
import type { EdgeRenderModel } from "./Edge";
import type { NodeRenderModel } from "./Node";
import type { EdgeKey } from "@/domain/passiveGraph/GraphEdge";

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

  allocated: {
    nodeIds: ReadonlySet<NodeId>;
    edgeKeys: ReadonlySet<EdgeKey>;
  };

  // reachableNodeIds: ReadonlySet<NodeId>;
  allocatableNodeIds: ReadonlySet<NodeId>;

  // hoveredNodeId: NodeId | null;

  // preview: {
  //   nodeIds: ReadonlySet<NodeId>;
  //   edgeKeys: ReadonlySet<EdgeKey>;
  // };
}

export interface HoverPreviewStateModel {
  hoveredNodeId: NodeId | null;
  highlight: {
    nodeIds: ReadonlySet<NodeId>;
    edgeKeys: ReadonlySet<EdgeKey>;
  };
  refund: {
    nodeIds: ReadonlySet<NodeId>;
    edgeKeys: ReadonlySet<EdgeKey>;
  };
}

export interface HoverVisualDelta extends HoverPreviewStateModel {
  previous: HoverPreviewStateModel;
}

export interface TreeRendererCallbacks {
  onNodeClick?: (nodeId: NodeId) => void;
  onNodeHover?: (nodeId: NodeId | null) => void;
}
