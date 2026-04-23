import { treeService } from "@/domain/TreeService";
import { canAllocate } from "@/domain/logic/allocation";
import type { ClassId } from "@/domain/models/passiveClass";
import type { NodeId } from "@/domain/models/passiveNode";
import { defineStore } from "pinia";

interface BuildStoreState {
  allocatedNodeIds: Set<NodeId>;
  activeClassId: ClassId | null;
  activeAscendancy: string | null;
  hoveredNodeId: NodeId | null;
  loading: boolean;
}

export const useBuildStore = defineStore("build", {
  state: (): BuildStoreState => ({
    allocatedNodeIds: new Set<NodeId>(),
    hoveredNodeId: null,
    activeClassId: null,
    activeAscendancy: null,
    loading: false,
  }),

  getters: {
    totalPointsSpent: (state) => state.allocatedNodeIds.size,
    isAllocated(state): (nodeId: NodeId) => boolean {
      return (nodeId) => state.allocatedNodeIds.has(nodeId);
    },
  },

  actions: {
    async initTree() {
      this.loading = true;
      await treeService.init();
      this.loading = false;
    },
    setHoveredNode(nodeId: NodeId | null) {
      this.hoveredNodeId = nodeId;
      // Ask the static domain to calculate the path using the adjacency map
    },
    resetAllocations() {
      this.allocatedNodeIds.clear();
    },
    selectClass(classId: ClassId) {
      this.resetAllocations();
      this.activeClassId = classId;
    },
    allocateNode(nodeId: NodeId) {
      this.allocatedNodeIds.add(nodeId);
    },
    toggleNodeAllocation(nodeId: NodeId) {
      if (!treeService.tree.value || this.activeClassId === null) return;
      if (this.isAllocated(nodeId)) {
        this.deallocateNode(nodeId);
      } else {
        if (canAllocate(treeService.tree.value, nodeId, this.allocatedNodeIds, this.activeClassId))
          this.allocateNode(nodeId);
      }
    },
    deallocateNode(_nodeId: NodeId) {
      // tricky
      // Should only allow leaf-like allocated nodes
      // OR deallocated all the nodes after
      // skip for now
      // this.allocatedNodeIds.delete(nodeId);
    },
  },
});
