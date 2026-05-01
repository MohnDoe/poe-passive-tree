import type { NodeId } from "@/domain/graph/PassiveNode";

export interface UiState {
  hoveredNodeId: NodeId | null;
}
