import type { NodeId } from "@/domain/graph/PassiveNode";
import type { EdgeRenderModel } from "./Edge";
import type { NodeRenderModel } from "./Node";
import type { EdgeKey } from "@/domain/graph/GraphEdge";
import type { HoverPreviewState } from "@/domain/build/models/allocation/HoverPreviewState";

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

export interface HoverVisualDelta extends HoverPreviewState {
  previous: HoverPreviewState;
}

export interface TreeRendererCallbacks {
  onNodeClick?: (nodeId: NodeId) => void;
  onNodeHover?: (nodeId: NodeId | null) => void;
}
