import type { NodeId } from "@/domain/graph/PassiveNode";
import { defineStore } from "pinia";

export interface UiStoreState {
  hoveredNodeId: NodeId | null;
}

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
