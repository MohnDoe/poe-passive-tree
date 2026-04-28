import type { AllocationSnapshot } from "@/domain/build/models/allocation/Allocation";
import { getAllocatableNodeIds } from "@/domain/build/selectors/getAllocatableNodeIds";
import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

export function canAllocate(snapshot: AllocationSnapshot, nodeId: NodeId): boolean {
  return getAllocatableNodeIds(snapshot).has(nodeId);
}
