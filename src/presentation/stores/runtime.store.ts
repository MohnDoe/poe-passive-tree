import type { PassiveGraph } from "@/domain/graph/PassiveGraph";
import type { PassiveTreeRenderAssets } from "@/domain/graph/PassiveTreeRenderAssets";
import { loadPassiveTree } from "@/infrastructure/loader/loadPassiveTree";
import { defineStore } from "pinia";

export interface RuntimeState {
  status: "idle" | "loading" | "ready" | "error";
  graph: PassiveGraph | null;
  assets: PassiveTreeRenderAssets | null;
  error: string | null;
}

export const useRuntimeStore = defineStore("runtime", {
  state: (): RuntimeState => ({
    status: "idle",
    graph: null,
    assets: null,
    error: null,
  }),
  actions: {
    async load() {
      if (this.status === "loading") return;
      this.status = "loading";
      this.error = null;

      try {
        const { graph, assets } = await loadPassiveTree();
        this.graph = graph;
        this.assets = assets;
        this.status = "ready";
      } catch (error) {
        this.graph = null;
        this.assets = null;
        this.error = error instanceof Error ? error.message : "Unknown runtime loading error.";
        this.status = "error";
      }
    },
  },
});
