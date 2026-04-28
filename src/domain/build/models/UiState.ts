import type { NodeId } from "@/domain/passiveGraph/PassiveNode";

export interface UiState {
  hoveredNodeId: NodeId | null;
}
