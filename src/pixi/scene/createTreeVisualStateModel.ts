import type { AllocationState } from "@/domain/build/models/allocation/Allocation";
import type { TreeVisualStateModel } from "../models/Render";

export interface CreateTreeVisualStateParams {
  allocationState: AllocationState | null;
}

export function createTreeVisualState({
  allocationState,
}: CreateTreeVisualStateParams): TreeVisualStateModel {
  //TODO: use it maybe later (hide non-connected or smth)

  if (!allocationState)
    return {
      allocatableNodeIds: new Set(),
      activeStartNodeIds: new Set(),
      allocated: {
        edgeKeys: new Set(),
        nodeIds: new Set(),
      },
    };

  return {
    activeStartNodeIds: allocationState.rootNodeIds,
    allocated: {
      nodeIds: allocationState.allocatedNodeIds,
      edgeKeys: allocationState.activeEdgeKeys,
    },
    allocatableNodeIds: allocationState.allocatableNodeIds,
  };
}
