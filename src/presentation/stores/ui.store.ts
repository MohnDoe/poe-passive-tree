import type { UiState } from "@/domain/build/models/UiState";
import type { NodeId } from "@/domain/graph/PassiveNode";
import { defineStore } from "pinia";

export type UiStoreState = UiState;

export const useUiStore = defineStore("ui", {
  state: (): UiStoreState => ({
    hoveredNodeId: null,
  }),
  actions: {
    setHoveredNodeId(nodeId: NodeId | null) {
      this.hoveredNodeId = nodeId;
    },
  },
});
