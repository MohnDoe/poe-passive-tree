import type { EdgeKey } from "../passiveGraph/GraphEdge";
import type { NodeId } from "../passiveGraph/PassiveNode";

export interface HoverPreview {
  targetNodeId: NodeId;
  canAllocate: boolean;
  canRefund: boolean;
  pathNodeIds: ReadonlySet<NodeId>;
  edgeKeys: ReadonlySet<EdgeKey>;
  addedPointCost: number;
}
