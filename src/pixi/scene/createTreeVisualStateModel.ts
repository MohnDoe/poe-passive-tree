import type { AllocationSnapshot } from "@/domain/build/models/allocation/Allocation";
import type { TreeVisualStateModel } from "../models/Render";

export interface CreateTreeVisualStateParams {
  snapshot: AllocationSnapshot | null;
}

export function createTreeVisualState({
  snapshot,
}: CreateTreeVisualStateParams): TreeVisualStateModel {
  //TODO: use it maybe later (hide non-connected or smth)

  if (!snapshot)
    return {
      allocatableNodeIds: new Set(),
      activeStartNodeIds: new Set(),
      allocated: {
        edgeKeys: new Set(),
        nodeIds: new Set(),
      },
    };

  return {
    activeStartNodeIds: snapshot.rootNodeIds,
    allocated: {
      nodeIds: snapshot.allocatedNodeIds,
      edgeKeys: snapshot.activeEdgeKeys,
    },
    allocatableNodeIds: snapshot.allocatableNodeIds,
  };
}
