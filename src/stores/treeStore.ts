import { loadPassiveTree } from "@/data/loaders/loadPassiveTree";
import { canAllocate } from "@/domain/logic/allocation";
import type { ClassId } from "@/domain/models/passiveClass";
import type { NodeId } from "@/domain/models/passiveNode";
import type { PassiveTree } from "@/domain/models/passiveTree";
import { defineStore } from "pinia";

interface TreeStoreState {
  tree: PassiveTree | null;
  selectedClassId: ClassId | null;
  allocatedNodeIds: Set<NodeId>;
  loading: boolean;
}

export const useTreeStore = defineStore("treeStore", {
  state: (): TreeStoreState => ({
    loading: false,
    tree: null,
    selectedClassId: null,
    allocatedNodeIds: new Set<NodeId>(),
  }),
  getters: {
    isAllocated(state): (nodeId: NodeId) => boolean {
      return (nodeId) => state.allocatedNodeIds.has(nodeId);
    },
    startNodeIds: (state): Set<NodeId> => {
      if (!state.tree || state.selectedClassId === null) return new Set();
      return state.tree.classes.get(state.selectedClassId)?.startNodeIds ?? new Set<NodeId>();
    },
  },
  actions: {
    async loadTree() {
      this.loading = true;
      try {
        this.tree = await loadPassiveTree();
      } finally {
        this.loading = false;
      }
    },
    selectClass(classId: ClassId) {
      this.resetAllocations();
      this.selectedClassId = classId;
    },
    allocateNode(nodeId: NodeId) {
      this.allocatedNodeIds.add(nodeId);
    },
    deallocateNode(_nodeId: NodeId) {
      // tricky
      // Should only allow leaf-like allocated nodes
      // OR deallocated all the nodes after
      // skip for now
      // this.allocatedNodeIds.delete(nodeId);
    },
    resetAllocations() {
      this.allocatedNodeIds.clear();
    },
    toggleNodeAllocation(nodeId: NodeId) {
      if (!this.tree) return;
      if (this.isAllocated(nodeId)) {
        this.deallocateNode(nodeId);
      } else {
        if (canAllocate(nodeId, this.allocatedNodeIds, this.startNodeIds, this.tree.adjacency))
          this.allocateNode(nodeId);
      }
    },
  },
});
