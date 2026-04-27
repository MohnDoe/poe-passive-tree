import type { NodeId } from "../passiveGraph/PassiveNode";

export interface RefundPreview {
  targetNodeId: NodeId;
  refundedNodeIds: ReadonlySet<NodeId>;
  refundedEdgeKeys: ReadonlySet<string>;
}
