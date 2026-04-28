import type { EdgeKey } from "@/domain/passiveGraph/GraphEdge";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

export interface HoverPreview {
  targetNodeId: NodeId;
  canAllocate: boolean;
  canRefund: boolean;
  pathNodeIds: ReadonlySet<NodeId>;
  edgeKeys: ReadonlySet<EdgeKey>;
  addedPointCost: number;
}
