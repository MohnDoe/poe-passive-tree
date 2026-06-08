import type { EdgeKey } from "@/domain/graph/GraphEdge";
import type { NodeId, PassiveNodeKind } from "@/domain/graph/PassiveNode";

export interface HoverPreviewState {
  hoveredNodeId: NodeId | null;
  highlight: {
    nodeIds: ReadonlySet<NodeId>;
    edgeKeys: ReadonlySet<EdgeKey>;
  };
  refund: {
    nodeIds: ReadonlySet<NodeId>;
    edgeKeys: ReadonlySet<EdgeKey>;
  };
  tooltip: {
    name: string;
    kind: PassiveNodeKind;
    stats: string[];
    budget: {
      cost: number | null;
      refundCount: number | null;
    };
  } | null;
}
