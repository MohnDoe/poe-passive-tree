import { loadPassiveTree } from "@/data/loaders/loadPassiveTree";
import { shallowRef } from "vue";
import type { PassiveTree } from "./models/passiveTree";

class TreeService {
  public tree = shallowRef<PassiveTree | null>(null);
  public loading = true;

  public async init() {
    console.log("[TreeService] Init...");
    this.loading = true;
    this.tree.value = await loadPassiveTree();
    this.loading = false;
    console.log("[TreeService] Initialized.");
  }
}

export const treeService = new TreeService();
