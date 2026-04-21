import { loadPassiveTree } from "@/data/loaders/loadPassiveTree";
import type { ClassId } from "@/domain/models/passiveClass";
import type { NodeId } from "@/domain/models/passiveNode";
import type { PassiveTree } from "@/domain/models/passiveTree";
import { defineStore } from "pinia";

interface TreeStoreState {
  tree: PassiveTree | null
  selectedClassId: ClassId | null
  allocatedNodeIds: Set<NodeId>
  loading: boolean
}

export const useTreeStore = defineStore("treeStore", {
  state: (): TreeStoreState => ({
    loading: false,
    tree: null,
    selectedClassId: null,
    allocatedNodeIds: new Set()
  }),
  actions: {
    async loadTree() {
      this.loading = true;
      const tree = await loadPassiveTree()
      this.tree = tree;
    }
  }
})
